// Builds data/academy.db (SQLite) from the Markdown course files in content/.
// Markdown is rendered to HTML here (with syntax highlighting) so pages and the API only read rows.
// Run: node scripts/build-db.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { Marked } from "marked";
import hljs from "highlight.js";
import { parseCourse, slugify } from "./parse-course.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content");
const dbPath = path.join(root, "data", "academy.db");

const LANG_ALIAS = {
  cs: "csharp", "c#": "csharp", tsql: "sql", "t-sql": "sql", ps: "powershell", ps1: "powershell", sh: "bash", shell: "bash",
  yml: "yaml", js: "javascript", ts: "typescript", html: "xml", vue: "xml", razor: "xml", cshtml: "xml", sol: "javascript", solidity: "javascript", vb: "vbnet", "vb.net": "vbnet", aspx: "xml", ascx: "xml", kusto: "sql", kql: "sql", gherkin: "gherkin", mermaid: "plaintext", pascal: "delphi",
};

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const marked = new Marked({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const raw = (lang || "").trim().toLowerCase();
      const language = LANG_ALIAS[raw] || raw;
      const html = language && hljs.getLanguage(language)
        ? hljs.highlight(text, { language, ignoreIllegals: true }).value
        : escapeHtml(text);
      const label = raw ? `<span class="code-lang">${escapeHtml(raw)}</span>` : "";
      return `<div class="code-block">${label}<button class="copy-btn" type="button" data-copy>Copy</button><pre><code class="hljs">${html}</code></pre></div>\n`;
    },
    table(token) {
      const cell = (c) => this.parser.parseInline(c.tokens);
      const header = token.header.map((c) => `<th>${cell(c)}</th>`).join("");
      const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`).join("");
      return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
    },
  },
});

const md = (s) => (s && s.trim() ? marked.parse(s.trim()) : "");

// Interview answers written as prose become a one-line summary + short bullet points for quick revision.
// Answers that already have structure (code, tables, lists, quotes) are rendered as written.
const ABBR = /\b(e\.g|i\.e|etc|vs|approx|incl)\./gi;
const KEEP = "\u0001";
function answerHtml(markdown) {
  const text = (markdown || "").trim();
  if (!text || /```|^\s*[-*>]\s|^\s*\d+\.\s|\|---/m.test(text)) return md(text);
  const guarded = text.replace(/\s*\n\s*/g, " ").replace(ABBR, (m) => m.slice(0, -1) + KEEP);
  let parts = guarded.split(/(?<=[.!?])\s+(?=[A-Z0-9`"(*])/).map((p) => p.replaceAll(KEEP, ".").trim()).filter(Boolean);
  parts = parts.flatMap((p) => (p.length > 170 && p.includes("; ") ? p.split("; ").map((x, i, a) => (i < a.length - 1 ? `${x};` : x)) : [p]));
  if (parts.length < 2) return md(text);
  const [first, ...rest] = parts;
  return `<p class="q-short"><strong>In short:</strong> ${marked.parseInline(first)}</p>\n<ul class="q-points">${rest.map((r) => `<li>${marked.parseInline(r)}</li>`).join("")}</ul>\n`;
}
const plain = (s) => (s || "").replace(/[#>*_`|]/g, " ").replace(/\s+/g, " ").trim();

const tracks = JSON.parse(fs.readFileSync(path.join(contentDir, "tracks.json"), "utf8"));
const files = fs.readdirSync(path.join(contentDir, "courses")).filter((f) => f.endsWith(".md")).sort();
const courses = files.map((f) => parseCourse(fs.readFileSync(path.join(contentDir, "courses", f), "utf8"), f));

const trackIndex = new Map(tracks.map((t, i) => [t.slug, i]));
const seen = new Set();
for (const c of courses) {
  if (!trackIndex.has(c.meta.track)) throw new Error(`${c.file}: unknown track "${c.meta.track}"`);
  if (seen.has(c.meta.slug)) throw new Error(`${c.file}: duplicate slug "${c.meta.slug}"`);
  seen.add(c.meta.slug);
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const tmpPath = dbPath + ".tmp";
fs.rmSync(tmpPath, { force: true });
const db = new Database(tmpPath);
db.pragma("journal_mode = DELETE");
db.exec(`
CREATE TABLE tracks (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, menu TEXT NOT NULL, ord INTEGER NOT NULL, summary TEXT NOT NULL);
CREATE TABLE courses (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, track_id INTEGER NOT NULL REFERENCES tracks(id),
  ord INTEGER NOT NULL, seq INTEGER NOT NULL, grp TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL, summary TEXT NOT NULL,
  overview_html TEXT NOT NULL, versions_html TEXT NOT NULL, lifecycle_html TEXT NOT NULL, tools_html TEXT NOT NULL);
CREATE TABLE modules (
  id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), ord INTEGER NOT NULL, title TEXT NOT NULL);
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), module_id INTEGER NOT NULL REFERENCES modules(id),
  seq INTEGER NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL, grade TEXT NOT NULL, priority TEXT NOT NULL,
  body_html TEXT NOT NULL, UNIQUE(course_id, slug));
CREATE TABLE questions (
  id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), ord INTEGER NOT NULL, level TEXT NOT NULL,
  priority TEXT NOT NULL, question TEXT NOT NULL, question_html TEXT NOT NULL, answer_html TEXT NOT NULL);
CREATE TABLE cheats (
  id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), ord INTEGER NOT NULL, title TEXT NOT NULL, body_html TEXT NOT NULL);
CREATE INDEX ix_questions_course ON questions(course_id, level, priority);
CREATE INDEX ix_lessons_course ON lessons(course_id, seq);
CREATE VIRTUAL TABLE search USING fts5(
  kind UNINDEXED, course_slug UNINDEXED, ref UNINDEXED, title, body, tokenize = 'porter unicode61');
`);

const insTrack = db.prepare("INSERT INTO tracks (slug, title, menu, ord, summary) VALUES (?, ?, ?, ?, ?)");
const insCourse = db.prepare(`INSERT INTO courses
  (slug, title, track_id, ord, seq, grp, icon, color, summary, overview_html, versions_html, lifecycle_html, tools_html)
  VALUES (@slug, @title, @track_id, @ord, @seq, @grp, @icon, @color, @summary, @overview, @versions, @lifecycle, @tools)`);
const insModule = db.prepare("INSERT INTO modules (course_id, ord, title) VALUES (?, ?, ?)");
const insLesson = db.prepare(`INSERT INTO lessons (course_id, module_id, seq, slug, title, grade, priority, body_html)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const insQ = db.prepare("INSERT INTO questions (course_id, ord, level, priority, question, question_html, answer_html) VALUES (?, ?, ?, ?, ?, ?, ?)");
const insCheat = db.prepare("INSERT INTO cheats (course_id, ord, title, body_html) VALUES (?, ?, ?, ?)");
const insSearch = db.prepare("INSERT INTO search (kind, course_slug, ref, title, body) VALUES (?, ?, ?, ?, ?)");

const stats = { courses: 0, lessons: 0, questions: 0, cheats: 0 };
db.transaction(() => {
  const trackIds = {};
  tracks.forEach((t, i) => { trackIds[t.slug] = insTrack.run(t.slug, t.title, t.menu || t.title, i + 1, t.summary).lastInsertRowid; });

  const ordered = [...courses].sort((a, b) =>
    trackIndex.get(a.meta.track) - trackIndex.get(b.meta.track) || Number(a.meta.order) - Number(b.meta.order));

  ordered.forEach((c, i) => {
    const m = c.meta;
    const courseId = insCourse.run({
      slug: m.slug, title: m.title, track_id: trackIds[m.track], ord: Number(m.order), seq: i + 1, grp: m.group || "",
      icon: m.icon || m.title.slice(0, 2), color: m.color || "#2563eb", summary: m.summary || "",
      overview: md(c.overview), versions: md(c.versions), lifecycle: md(c.lifecycle), tools: md(c.tools),
    }).lastInsertRowid;
    stats.courses++;
    insSearch.run("course", m.slug, "", m.title, plain(`${m.summary} ${c.overview} ${c.versions} ${c.lifecycle} ${c.tools}`));

    let seq = 0;
    const lessonSlugs = new Set();
    c.modules.forEach((mod, mi) => {
      const moduleId = insModule.run(courseId, mi + 1, mod.title).lastInsertRowid;
      for (const l of mod.lessons) {
        let slug = slugify(l.title);
        while (lessonSlugs.has(slug)) slug += "-2";
        lessonSlugs.add(slug);
        insLesson.run(courseId, moduleId, ++seq, slug, l.title, l.grade, l.priority, md(l.body));
        insSearch.run("lesson", m.slug, slug, l.title, plain(l.body));
        stats.lessons++;
      }
    });
    c.questions.forEach((q, qi) => {
      const id = insQ.run(courseId, qi + 1, q.level, q.priority, q.question.replace(/`/g, ""), marked.parseInline(q.question), answerHtml(q.answer)).lastInsertRowid;
      insSearch.run("question", m.slug, String(id), q.question, plain(q.answer));
      stats.questions++;
    });
    c.cheats.forEach((s, si) => {
      insCheat.run(courseId, si + 1, s.title, md(s.body));
      insSearch.run("cheat", m.slug, String(si + 1), s.title, plain(s.body));
      stats.cheats++;
    });
  });
})();
db.close();
fs.rmSync(dbPath, { force: true });
fs.renameSync(tmpPath, dbPath);
console.log(`academy.db built: ${stats.courses} courses, ${stats.lessons} lessons, ${stats.questions} questions, ${stats.cheats} cheat-sheet sections`);

// The SQL playground runs SQLite in the browser; ship sql.js as static files.
const sqljsOut = path.join(root, "public", "sqljs");
fs.mkdirSync(sqljsOut, { recursive: true });
for (const f of ["sql-wasm.js", "sql-wasm.wasm"]) fs.copyFileSync(path.join(root, "node_modules", "sql.js", "dist", f), path.join(sqljsOut, f));
