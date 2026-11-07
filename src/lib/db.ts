import "server-only";
import path from "node:path";
import Database from "better-sqlite3";

// Read-only SQLite database built by scripts/build-db.mjs.
let db: Database.Database | null = null;
function conn() {
  if (!db) db = new Database(path.join(process.cwd(), "data", "academy.db"), { readonly: true, fileMustExist: true });
  return db;
}

export type Track = { id: number; slug: string; title: string; menu: string; ord: number; summary: string };
export type CourseSummary = {
  id: number; slug: string; title: string; track_slug: string; track_title: string; seq: number; grp: string;
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
/** One search result; `snippet` is HTML with matches wrapped in <mark>. */
export type SearchHit = { kind: string; course_slug: string; course_title: string; ref: string; title: string; snippet: string };

const COURSE_COLS = `c.id, c.slug, c.title, t.slug AS track_slug, t.title AS track_title, c.seq, c.grp, c.icon, c.color, c.summary,
  (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lessons,
  (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) AS questions,
  (SELECT COUNT(*) FROM cheats s WHERE s.course_id = c.id) AS cheats`;

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Scenario"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;

export function getTracks(): Track[] {
  return conn().prepare("SELECT id, slug, title, menu, ord, summary FROM tracks ORDER BY ord").all() as Track[];
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

export function getQuestionsForCourse(courseId: number): Question[] {
  return conn().prepare(`SELECT q.id, c.slug AS course_slug, c.title AS course_title, q.ord, q.level, q.priority, q.question, q.question_html, q.answer_html
    FROM questions q JOIN courses c ON c.id = q.course_id WHERE c.id = ? ORDER BY q.ord`).all(courseId) as Question[];
}

export function getStats() {
  return conn().prepare(`SELECT
    (SELECT COUNT(*) FROM tracks) AS tracks, (SELECT COUNT(*) FROM courses) AS courses,
    (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM questions) AS questions,
    (SELECT COUNT(*) FROM questions WHERE level = 'Scenario') AS scenarios,
    (SELECT COUNT(*) FROM cheats) AS cheats`).get() as Record<string, number>;
}

/** All questions for a set of courses, in the given course order, most-asked first within each course. */
export function getQuestionsForCourses(slugs: string[]): Question[] {
  if (!slugs.length) return [];
  const rows = conn().prepare(`SELECT q.id, c.slug AS course_slug, c.title AS course_title, q.ord, q.level, q.priority, q.question, q.question_html, q.answer_html
    FROM questions q JOIN courses c ON c.id = q.course_id WHERE c.slug IN (${slugs.map(() => "?").join(",")})
    ORDER BY CASE q.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
      CASE q.level WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 WHEN 'Advanced' THEN 3 ELSE 4 END, q.ord`).all(...slugs) as Question[];
  const rank = new Map(slugs.map((s, i) => [s, i]));
  return rows.sort((a, b) => rank.get(a.course_slug)! - rank.get(b.course_slug)!);
}

export type QuestionIndexRow = { id: number; course_slug: string; level: string; priority: string; question_html: string };

/** Every question (titles only) for the topic-wise index, most important first within each course. */
export function getQuestionIndex(): QuestionIndexRow[] {
  return conn().prepare(`SELECT q.id, c.slug AS course_slug, q.level, q.priority, q.question_html
    FROM questions q JOIN courses c ON c.id = q.course_id
    ORDER BY c.seq, CASE q.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
      CASE q.level WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 WHEN 'Advanced' THEN 3 ELSE 4 END, q.ord`).all() as QuestionIndexRow[];
}

/** Every question in the default list order (course, then High → Low priority) — served as a static JSON file. */
export function getAllQuestions(): Question[] {
  return conn().prepare(`SELECT q.id, c.slug AS course_slug, c.title AS course_title, q.ord, q.level, q.priority, q.question, q.question_html, q.answer_html
    FROM questions q JOIN courses c ON c.id = q.course_id
    ORDER BY c.seq, CASE q.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, q.ord`).all() as Question[];
}

export type SearchDoc = { kind: string; course_slug: string; course_title: string; ref: string; title: string; body: string };

/** The full-text search rows (plain text) — searched in the browser so the site can be hosted as static files. */
export function getSearchDocs(): SearchDoc[] {
  return conn().prepare(`SELECT s.kind, s.course_slug, c.title AS course_title, s.ref, s.title, s.body
    FROM search s JOIN courses c ON c.slug = s.course_slug`).all() as SearchDoc[];
}
