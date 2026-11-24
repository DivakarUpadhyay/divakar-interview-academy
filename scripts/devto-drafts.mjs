// Creates dev.to DRAFTS (never published) from DevLadder lessons, so a person can review and publish them by hand.
// Each draft = a teaser (opening of the lesson, one interview question, more questions to try) + links back to the lesson, with
// canonical_url pointing at DevLadder so search engines treat the lesson page as the original.
//
// Usage: node scripts/devto-drafts.mjs [--count 7] [--dry-run] [--refresh] [--refresh-published] [--show]
// Needs DEVTO_API_KEY in .env.devto.local (gitignored). Lessons already on dev.to (draft or published) are skipped,
// detected by their canonical URL, so the script can run every week without duplicates.
import fs from "node:fs";
import path from "node:path";
import { parseCourse, slugify } from "./parse-course.mjs";

const args = process.argv.slice(2);
const count = Number(args[args.indexOf("--count") + 1]) || 7;
const dryRun = args.includes("--dry-run");
const SITE = "https://devladder.pages.dev";
const API = "https://dev.to/api";

const env = fs.existsSync(".env.devto.local") ? fs.readFileSync(".env.devto.local", "utf8") : "";
const KEY = process.env.DEVTO_API_KEY ?? env.match(/^DEVTO_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("DEVTO_API_KEY missing: put it in .env.devto.local");
const headers = { "api-key": KEY, "content-type": "application/json", accept: "application/vnd.forem.api-v1+json", "user-agent": "devladder-drafts" };

// dev.to allows 4 tags: lowercase letters and digits only.
const TRACK_TAGS = {
  dotnet: ["dotnet", "csharp"], data: ["sql", "database"], "devops-cloud": ["devops", "cloud"], frontend: ["javascript", "webdev"],
  foundations: ["programming", "computerscience"], automation: ["automation", "testing"], web3: ["web3", "blockchain"], interview: ["career", "interview"],
};
const tagsFor = (track, grade, course) => [...(course === "vbnet" ? ["dotnet", "vbnet"] : TRACK_TAGS[track] ?? ["programming"]), grade === "Basic" ? "beginners" : "tutorial", "interview"]
  .filter((t, i, a) => a.indexOf(t) === i).slice(0, 4);

// Every lesson with its URL and the course's High-priority questions.
function lessons() {
  const out = [];
  for (const f of fs.readdirSync("content/courses").filter((f) => f.endsWith(".md")).sort()) {
    const c = parseCourse(fs.readFileSync(path.join("content/courses", f), "utf8"), f);
    const top = c.questions.filter((q) => q.priority === "High");
    const all = c.modules.flatMap((m) => m.lessons);
    const used = new Set();
    const items = all.map((l, i) => {
      let slug = slugify(l.title);
      while (used.has(slug)) slug += "-2";
      used.add(slug);
      return { ...l, slug, index: i, total: all.length, course: c.meta, url: `${SITE}/courses/${c.meta.slug}/lessons/${slug}`, top };
    });
    items.forEach((l, i) => out.push({ ...l, next: items[i + 1] }));
  }
  return out;
}

// dev.to series per track: readers see "Part N of M" and a list linking the other posts.
const SERIES = {
  dotnet: "DevLadder: C# & .NET from Scratch", data: "DevLadder: SQL Server & Data", "devops-cloud": "DevLadder: Cloud & DevOps",
  frontend: "DevLadder: Frontend Essentials", foundations: "DevLadder: CS Fundamentals for Interviews", interview: "DevLadder: Interview Prep",
  automation: "DevLadder: Automation & Industry 4.0", web3: "DevLadder: Web3 Basics",
};

// High-priority lessons first, taking one lesson per course in turn so the feed stays varied.
function pick(all, done, n) {
  const byCourse = new Map();
  for (const l of all.filter((l) => l.priority === "High" && !done.has(l.url))) {
    if (!byCourse.has(l.course.slug)) byCourse.set(l.course.slug, []);
    byCourse.get(l.course.slug).push(l);
  }
  // Tracks whose topics advertisers pay most for come first.
  const order = ["dotnet", "data", "devops-cloud", "frontend", "interview", "foundations", "automation", "web3"];
  const queues = [...byCourse.values()].sort((a, b) => order.indexOf(a[0].course.track) - order.indexOf(b[0].course.track));
  const picked = [];
  const topic = (t) => t.toLowerCase().split(/\s+[—:-]\s*/)[0];
  const seen = new Set();
  for (let round = 0; picked.length < n && queues.some((q) => q.length > round); round++)
    for (const q of queues) {
      const l = q[round];
      if (!l || picked.length >= n || seen.has(topic(l.title))) continue;
      seen.add(topic(l.title));
      picked.push(l);
    }
  return picked;
}

// Splits Markdown into blank-line blocks without breaking code fences.
function blocks(md) {
  const out = [];
  let cur = [], fence = false;
  for (const line of md.trim().split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (!fence && line.trim() === "" && cur.length) { out.push(cur.join("\n")); cur = []; continue; }
    cur.push(line);
  }
  if (cur.length) out.push(cur.join("\n"));
  return out;
}
const words = (s) => s.split(/\s+/).filter(Boolean).length;

// Teaser: the opening of the lesson only. Full-length posts got ~390 dev.to views and zero clicks to the site
// (2026-11-24), because readers had nothing left to come for. Short lessons stay whole; the hook is then the questions.
function teaser(body) {
  const bs = blocks(body);
  const total = words(body);
  if (total < 140 || bs.length < 3) return { shown: body.trim(), rest: [] };
  const shown = [];
  let n = 0;
  for (const b of bs) {
    if (shown.length >= 2 && n >= total * 0.45) break;
    shown.push(b);
    n += words(b);
  }
  // Names of the sections the reader hasn't seen yet, from "**Label:**" openings.
  const rest = bs.slice(shown.length).map((b) => b.match(/^\*\*([^*]{3,60}?):?\*\*/)?.[1]?.replace(/[:(].*$/, "").trim()).filter(Boolean);
  return { shown: shown.join("\n\n"), rest: [...new Set(rest)].slice(0, 5) };
}

function article(l) {
  const courseUrl = `${SITE}/courses/${l.course.slug}`;
  const courseName = l.course.title.split(": ")[0];
  const next = l.next ? `\n\nNext in the course: [${l.next.title}](${l.next.url}) →` : "";
  const { shown, rest } = teaser(l.body);
  const cut = shown.length < l.body.trim().length;
  // Rotate by lesson so posts from one course don't all open with the same question.
  const k = l.top.length ? l.index % l.top.length : 0;
  const [first, ...others] = [...l.top.slice(k), ...l.top.slice(0, k)];
  const more = others.slice(0, 4).map((q) => `- ${q.question}`).join("\n");
  const restLine = rest.length ? `The full lesson goes on to cover: ${rest.join(", ")}.\n\n` : "";
  // The first line pulls readers to the site: dev.to readers rarely scroll to a link at the bottom.
  const body = `**👉 [Read the full lesson on DevLadder](${l.url})** (free, lesson ${l.index + 1} of ${l.total} in the [${l.course.title}](${courseUrl}) course)

${shown}

${cut ? `${restLine}**[Continue reading the lesson →](${l.url})**\n\n` : ""}## An interview question on ${courseName}

${first ? `### ${first.question}\n\n${first.answer.trim()}` : ""}

## Can you answer these?

${more}

The answers, plus ${Math.max(l.top.length - 1, 0)} more ${courseName} interview questions and a mock-interview mode, are free on **[DevLadder](${l.url})**.${next}`;
  return {
    title: `${l.title} (${l.course.title.split(": ")[0].split(" (")[0]})`.slice(0, 128),
    body_markdown: body,
    published: false,
    canonical_url: l.url,
    series: SERIES[l.course.track] ?? "DevLadder",
    tags: tagsFor(l.course.track, l.grade, l.course.slug),
    description: (l.course.summary ?? "").slice(0, 150),
  };
}

async function call(method, url, body) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 35000)); continue; }
    if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${await res.text()}`);
    return res.json();
  }
  throw new Error(`${method} ${url} → still rate limited`);
}

// Canonical URLs already on dev.to (drafts and published).
const done = new Set();
for (let page = 1; ; page++) {
  const items = await call("GET", `${API}/articles/me/all?per_page=1000&page=${page}`);
  items.forEach((a) => a.canonical_url && done.add(a.canonical_url.replace(/\/$/, "")));
  if (items.length < 1000) break;
}

// --refresh: rewrite title and body of drafts this script created (e.g. after a template change).
// --refresh-published: do the same for posts already live (keeps them published, same URL).
if (args.includes("--refresh") || args.includes("--refresh-published")) {
  const live = args.includes("--refresh-published");
  const byUrl = new Map(lessons().map((l) => [l.url, l]));
  // /articles/me/published leaves out scheduled posts (published with a future date), so filter the full list.
  const drafts = (await call("GET", `${API}/articles/me/all?per_page=1000`)).filter((a) => a.published === live);
  for (const d of drafts) {
    const l = byUrl.get((d.canonical_url ?? "").replace(/\/$/, ""));
    if (!l) continue;
    const { published, ...fields } = article(l);
    if (dryRun) { console.log(`- would update #${d.id}: ${fields.title}`); if (args.includes("--show")) console.log(`${fields.body_markdown}\n`); continue; }
    await call("PUT", `${API}/articles/${d.id}`, { article: live ? { ...fields, published_at: d.published_at } : { ...fields, published: false } });
    console.log(`- refreshed ${live ? "post" : "draft"} #${d.id}: ${fields.title}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  process.exit(0);
}

const picks = pick(lessons(), done, count);
console.log(`${done.size} lesson(s) already on dev.to; creating ${picks.length} draft(s)${dryRun ? " (dry run)" : ""}`);
for (const l of picks) {
  const a = article(l);
  if (dryRun) { console.log(`- ${a.title}  [${a.tags.join(", ")}]  ${a.canonical_url}`); continue; }
  const created = await call("POST", `${API}/articles`, { article: a });
  console.log(`- draft #${created.id}: ${a.title}`);
  await new Promise((r) => setTimeout(r, 4000));
}
if (!dryRun && picks.length) console.log("Review and publish them at https://dev.to/dashboard (one a day works best).");
