import "server-only";
import path from "node:path";
import Database from "better-sqlite3";

// Read-only SQLite database built by scripts/build-db.mjs.
let db: Database.Database | null = null;
function conn() {
  if (!db) db = new Database(path.join(process.cwd(), "data", "academy.db"), { readonly: true, fileMustExist: true });
  return db;
}

export type Track = { id: number; slug: string; title: string; ord: number; summary: string };
export type CourseSummary = {
  id: number; slug: string; title: string; track_slug: string; track_title: string; seq: number;
  icon: string; color: string; summary: string; lessons: number; questions: number; cheats: number;
};
export type Course = CourseSummary & { overview_html: string; versions_html: string; lifecycle_html: string; tools_html: string };
export type LessonRef = { id: number; slug: string; title: string; seq: number; grade: string; priority: string; module_id: number };
export type Module = { id: number; ord: number; title: string; lessons: LessonRef[] };
export type Lesson = LessonRef & { body_html: string; module_title: string };
export type Question = {
  id: number; course_slug: string; course_title: string; ord: number; level: string; priority: string;
  question: string; question_html: string; answer_html: string;
};
export type Cheat = { id: number; ord: number; title: string; body_html: string };
export type SearchHit = { kind: string; course_slug: string; course_title: string; ref: string; title: string; snippet: string };

const COURSE_COLS = `c.id, c.slug, c.title, t.slug AS track_slug, t.title AS track_title, c.seq, c.icon, c.color, c.summary,
  (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lessons,
  (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) AS questions,
  (SELECT COUNT(*) FROM cheats s WHERE s.course_id = c.id) AS cheats`;

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Scenario"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;

export function getTracks(): Track[] {
  return conn().prepare("SELECT id, slug, title, ord, summary FROM tracks ORDER BY ord").all() as Track[];
}

export function getCourses(): CourseSummary[] {
  return conn().prepare(`SELECT ${COURSE_COLS} FROM courses c JOIN tracks t ON t.id = c.track_id ORDER BY c.seq`).all() as CourseSummary[];
}

export function getCourse(slug: string): Course | undefined {
  return conn().prepare(`SELECT ${COURSE_COLS}, c.overview_html, c.versions_html, c.lifecycle_html, c.tools_html
    FROM courses c JOIN tracks t ON t.id = c.track_id WHERE c.slug = ?`).get(slug) as Course | undefined;
}

export function getSyllabus(courseId: number): Module[] {
  const modules = conn().prepare("SELECT id, ord, title FROM modules WHERE course_id = ? ORDER BY ord").all(courseId) as Omit<Module, "lessons">[];
  const lessons = conn().prepare("SELECT id, slug, title, seq, grade, priority, module_id FROM lessons WHERE course_id = ? ORDER BY seq").all(courseId) as LessonRef[];
  return modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.module_id === m.id) }));
}

export function getLesson(courseId: number, slug: string): Lesson | undefined {
  return conn().prepare(`SELECT l.id, l.slug, l.title, l.seq, l.grade, l.priority, l.module_id, l.body_html, m.title AS module_title
    FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.course_id = ? AND l.slug = ?`).get(courseId, slug) as Lesson | undefined;
}

export function getAllLessonParams(): { slug: string; lesson: string }[] {
  return conn().prepare("SELECT c.slug, l.slug AS lesson FROM lessons l JOIN courses c ON c.id = l.course_id").all() as { slug: string; lesson: string }[];
}

export function getCheats(courseId: number): Cheat[] {
  return conn().prepare("SELECT id, ord, title, body_html FROM cheats WHERE course_id = ? ORDER BY ord").all(courseId) as Cheat[];
}

export type QuestionFilter = {
  courses?: string[]; levels?: string[]; priorities?: string[]; q?: string; limit?: number; offset?: number; random?: boolean;
};

export function findQuestions(f: QuestionFilter): { total: number; items: Question[] } {
  const where: string[] = [];
  const args: unknown[] = [];
  const inList = (col: string, vals?: string[]) => {
    if (vals && vals.length) { where.push(`${col} IN (${vals.map(() => "?").join(",")})`); args.push(...vals); }
  };
  inList("c.slug", f.courses);
  inList("q.level", f.levels);
  inList("q.priority", f.priorities);
  if (f.q && f.q.trim()) {
    where.push("(q.question LIKE ? OR q.answer_html LIKE ?)");
    const like = `%${f.q.trim().replace(/[%_]/g, "")}%`;
    args.push(like, like);
  }
  const from = `FROM questions q JOIN courses c ON c.id = q.course_id ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const total = (conn().prepare(`SELECT COUNT(*) AS n ${from}`).get(...args) as { n: number }).n;
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 500);
  const offset = Math.max(f.offset ?? 0, 0);
  const order = f.random ? "RANDOM()" : "c.seq, CASE q.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, q.ord";
  const items = conn().prepare(`SELECT q.id, c.slug AS course_slug, c.title AS course_title, q.ord, q.level, q.priority, q.question, q.question_html, q.answer_html
    ${from} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, limit, offset) as Question[];
  return { total, items };
}

export function getQuestionsForCourse(courseId: number): Question[] {
  return conn().prepare(`SELECT q.id, c.slug AS course_slug, c.title AS course_title, q.ord, q.level, q.priority, q.question, q.question_html, q.answer_html
    FROM questions q JOIN courses c ON c.id = q.course_id WHERE c.id = ? ORDER BY q.ord`).all(courseId) as Question[];
}

export function search(term: string, limit = 40): SearchHit[] {
  // Quote every word so user input can't break FTS5 syntax; prefix-match the last word.
  const words = term.toLowerCase().match(/[\p{L}\p{N}#+.]+/gu)?.slice(0, 8) ?? [];
  if (!words.length) return [];
  const match = words.map((w, i) => `"${w.replace(/"/g, "")}"${i === words.length - 1 ? "*" : ""}`).join(" ");
  return conn().prepare(`SELECT s.kind, s.course_slug, c.title AS course_title, s.ref, s.title,
      snippet(search, 4, char(2), char(3), ' … ', 18) AS snippet
    FROM search s JOIN courses c ON c.slug = s.course_slug
    WHERE search MATCH ? ORDER BY bm25(search, 0, 0, 0, 8.0, 1.0) LIMIT ?`).all(match, Math.min(limit, 100)) as SearchHit[];
}

export function getStats() {
  return conn().prepare(`SELECT
    (SELECT COUNT(*) FROM tracks) AS tracks, (SELECT COUNT(*) FROM courses) AS courses,
    (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM questions) AS questions,
    (SELECT COUNT(*) FROM questions WHERE level = 'Scenario') AS scenarios,
    (SELECT COUNT(*) FROM cheats) AS cheats`).get() as Record<string, number>;
}
