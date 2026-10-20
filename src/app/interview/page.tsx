import type { Metadata } from "next";
import { getCourses, getTracks } from "@/lib/db";
import InterviewPanel from "./InterviewPanel";

export const metadata: Metadata = { title: "Interview Q&A panel" };

export default function InterviewPage() {
  const tracks = getTracks();
  const courses = getCourses().map(({ slug, title, track_slug, questions }) => ({ slug, title, track_slug, questions }));
  return (
    <>
      <h1>Interview Q&amp;A panel</h1>
      <p className="muted">
        Every interview question, topic by topic. Filter by course, level (Beginner → Advanced, plus real-world Scenario
        questions) and priority. Answers include examples and code. Data comes from the REST API
        (<code>/api/questions</code>).
      </p>
      <InterviewPanel tracks={tracks.map(({ slug, title }) => ({ slug, title }))} courses={courses} />
    </>
  );
}
