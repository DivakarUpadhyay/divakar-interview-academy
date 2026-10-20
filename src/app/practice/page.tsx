import type { Metadata } from "next";
import { getCourses, getTracks } from "@/lib/db";
import PracticePanel from "./PracticePanel";

export const metadata: Metadata = { title: "Practice — mock interview" };

export default function PracticePage() {
  const tracks = getTracks().map(({ slug, title }) => ({ slug, title }));
  const courses = getCourses().map(({ slug, title, track_slug, questions }) => ({ slug, title, track_slug, questions }));
  return (
    <>
      <h1>Practice panel — mock interview</h1>
      <p className="muted">
        Pick topics, levels and priorities. You get random questions one at a time with a timer. Answer out loud first, then
        reveal the model answer and rate yourself. At the end you see your score, weak areas and the questions to revise.
      </p>
      <PracticePanel tracks={tracks} courses={courses} />
    </>
  );
}
