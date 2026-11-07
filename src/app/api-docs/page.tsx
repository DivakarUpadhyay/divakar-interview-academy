import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({ title: "REST API", description: "Read-only JSON API for DevLadder: tracks, courses, lessons, interview questions, cheat sheets and the full question and search data sets.", path: "/api-docs" });

const ENDPOINTS: [string, string, string, string][] = [
  ["GET", "/api/tracks.json", "/api/tracks.json", "Learning tracks in order, each with its courses."],
  ["GET", "/api/courses.json", "/api/courses.json", "All courses in learning order with lesson, question and cheat-sheet counts."],
  ["GET", "/api/courses/{slug}/course.json", "/api/courses/csharp/course.json", "One course: overview, versions, lifecycle, tools (HTML) and the module → lesson syllabus."],
  ["GET", "/api/courses/{slug}/lessons/{lesson}/lesson.json", "/api/courses/csharp/lessons/value-types-vs-reference-types/lesson.json", "One lesson with grade, priority and HTML body."],
  ["GET", "/api/courses/{slug}/questions.json", "/api/courses/csharp/questions.json", "Every interview question of one course, in course order."],
  ["GET", "/api/courses/{slug}/cheatsheet.json", "/api/courses/csharp/cheatsheet.json", "Cheat-sheet sections for one course."],
  ["GET", "/data/questions.json", "/data/questions.json", "All interview questions with level, priority and HTML answer (filter them on your side)."],
  ["GET", "/data/search.json", "/data/search.json", "Plain-text rows for lessons, questions, cheat sheets and courses, used by the site search."],
  ["GET", "/api/stats.json", "/api/stats.json", "Totals: tracks, courses, lessons, questions, scenario questions, cheat-sheet sections."],
];

export default function ApiDocs() {
  return (
    <div className="narrow">
      <h1>REST API</h1>
      <p className="muted">
        Content lives in a SQLite database (<code>data/academy.db</code>) generated from the Markdown files in
        <code> content/courses</code> by <code>scripts/build-db.mjs</code>. Every page and every JSON file below is generated from it at build time, so the whole site is served as static files.
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
