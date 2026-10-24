import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getCourses, getTracks } from "@/lib/db";
import CourseCard from "@/components/CourseCard";

export const metadata: Metadata = pageMeta({ title: "All Courses", description: "Every course in learning order — fundamentals, .NET, database, cloud and DevOps, frontend, automation, Web3 and interview preparation — with lessons, interview Q&A and cheat sheets.", path: "/courses" });

export default function CoursesPage() {
  const tracks = getTracks();
  const courses = getCourses();
  return (
    <>
      <h1>All courses</h1>
      <p className="muted">Numbered in the recommended learning order. Each course: syllabus → lessons → interview Q&amp;A → cheat sheet.</p>
      {tracks.map((t) => (
        <section key={t.slug} className="track">
          <h2>{t.title}</h2>
          <div className="grid">{courses.filter((c) => c.track_slug === t.slug).map((c) => <CourseCard key={c.slug} c={c} />)}</div>
        </section>
      ))}
    </>
  );
}
