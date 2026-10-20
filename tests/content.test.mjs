// Content and database checks. Run: npm test (builds the DB first if missing).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Database from "better-sqlite3";
import { parseCourse, LEVELS, GRADES, PRIORITIES } from "../scripts/parse-course.mjs";

const root = path.resolve(import.meta.dirname, "..");
const coursesDir = path.join(root, "content", "courses");
const dbPath = path.join(root, "data", "academy.db");
if (!fs.existsSync(dbPath)) execFileSync(process.execPath, [path.join(root, "scripts", "build-db.mjs")], { stdio: "inherit" });

const files = fs.readdirSync(coursesDir).filter((f) => f.endsWith(".md"));
const courses = files.map((f) => parseCourse(fs.readFileSync(path.join(coursesDir, f), "utf8"), f));

test("parser splits modules, lessons, questions and cheat sheets", () => {
  const sample = [
    "---", "slug: t", "title: T", "track: foundations", "order: 1", "---",
    "# Overview", "Intro", "# Module: M1", "## Lesson: [Basic|High] L1", "Body with code:",
    "```bash", "# not a heading", "## also not a heading", "```",
    "# Interview", "## [Scenario|Low] Q1?", "Answer", "# Cheatsheet", "## S1", "Item",
  ].join("\n");
  const c = parseCourse(sample, "sample.md");
  assert.equal(c.modules.length, 1);
  assert.equal(c.modules[0].lessons[0].grade, "Basic");
  assert.match(c.modules[0].lessons[0].body, /# not a heading/);
  assert.deepEqual(c.questions.map((q) => [q.level, q.priority]), [["Scenario", "Low"]]);
  assert.equal(c.cheats[0].title, "S1");
});

test("parser rejects unknown levels", () => {
  assert.throws(() => parseCourse("---\nslug: t\ntitle: T\ntrack: x\norder: 1\n---\n# Interview\n## [Expert|High] Q\nA", "bad.md"));
});

test("every course has the required sections and enough content", () => {
  for (const c of courses) {
    assert.ok(c.overview && c.versions && c.lifecycle && c.tools, `${c.file}: overview/versions/lifecycle/tools`);
    const lessons = c.modules.flatMap((m) => m.lessons);
    assert.ok(lessons.length >= 8, `${c.file}: only ${lessons.length} lessons`);
    assert.ok(c.questions.length >= 15, `${c.file}: only ${c.questions.length} questions`);
    assert.ok(c.questions.some((q) => q.level === "Scenario"), `${c.file}: no scenario questions`);
    assert.ok(c.cheats.length >= 5, `${c.file}: only ${c.cheats.length} cheat-sheet sections`);
    for (const l of lessons) assert.ok(GRADES.includes(l.grade) && PRIORITIES.includes(l.priority));
    for (const q of c.questions) assert.ok(LEVELS.includes(q.level) && PRIORITIES.includes(q.priority));
  }
});

test("database matches the content files", () => {
  const db = new Database(dbPath, { readonly: true });
  const n = (sql) => db.prepare(sql).get().n;
  assert.equal(n("SELECT COUNT(*) AS n FROM courses"), courses.length);
  assert.equal(n("SELECT COUNT(*) AS n FROM questions"), courses.reduce((s, c) => s + c.questions.length, 0));
  assert.equal(n("SELECT COUNT(*) AS n FROM lessons WHERE body_html = ''"), 0);
  assert.equal(n("SELECT COUNT(DISTINCT seq) AS n FROM courses"), courses.length, "course sequence numbers unique");
  const hits = db.prepare("SELECT COUNT(*) AS n FROM search WHERE search MATCH ?").get('"deadlock"').n;
  assert.ok(hits > 0, "full-text search finds content");
  db.close();
});
