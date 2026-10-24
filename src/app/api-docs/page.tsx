import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({ title: "REST API", description: "Read-only REST API for DevLadder: courses, lessons, interview questions with filters, cheat sheets and full-text search, with request examples.", path: "/api-docs" });

const ENDPOINTS: [string, string, string, string][] = [
  ["GET", "/api/tracks", "/api/tracks", "Learning tracks in order, each with its courses."],
  ["GET", "/api/courses", "/api/courses", "All courses in learning order with lesson, question and cheat-sheet counts."],
  ["GET", "/api/courses/{slug}", "/api/courses/csharp", "One course: overview, versions, lifecycle, tools (HTML) and the module → lesson syllabus."],
  ["GET", "/api/courses/{slug}/lessons/{lesson}", "/api/courses/csharp/lessons/value-types-vs-reference-types", "One lesson with grade, priority and HTML body."],
  ["GET", "/api/courses/{slug}/questions?level=&priority=&q=", "/api/courses/csharp/questions?priority=High", "Interview questions for one course."],
  ["GET", "/api/courses/{slug}/cheatsheet", "/api/courses/csharp/cheatsheet", "Cheat-sheet sections for one course."],
  ["GET", "/api/questions?course=a,b&level=Beginner,Scenario&priority=High&q=&limit=50&offset=0", "/api/questions?course=sqlserver&level=Scenario&limit=5", "All questions, filtered and paged. Returns { total, items }."],
  ["GET", "/api/questions/random?course=&level=&priority=&count=10", "/api/questions/random?count=3", "A random set for mock interviews (not cached)."],
  ["GET", "/api/search?q=text", "/api/search?q=dependency%20injection", "Full-text search (SQLite FTS5) across lessons, questions, cheat sheets and courses."],
  ["GET", "/api/stats", "/api/stats", "Totals: tracks, courses, lessons, questions, scenario questions, cheat-sheet sections."],
];

export default function ApiDocs() {
  return (
    <div className="narrow">
      <h1>REST API</h1>
      <p className="muted">
        Content lives in a SQLite database (<code>data/academy.db</code>) generated from the Markdown files in
        <code> content/courses</code> by <code>scripts/build-db.mjs</code>. The pages and this read-only JSON API both read from it.
      </p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Method</th><th>Endpoint</th><th>Returns</th></tr></thead>
          <tbody>
            {ENDPOINTS.map(([m, p, example, d]) => (
              <tr key={p}><td>{m}</td><td><a href={example}><code>{p}</code></a></td><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Levels and priorities</h2>
      <ul>
        <li><b>Lesson grade:</b> Basic, Intermediate, Advanced.</li>
        <li><b>Question level:</b> Beginner, Intermediate, Advanced, Scenario.</li>
        <li><b>Priority:</b> High (asked very often), Medium, Low.</li>
      </ul>
    </div>
  );
}
