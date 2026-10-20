import Link from "next/link";
import type { Course } from "@/lib/db";

const TABS = [
  ["", "Syllabus"],
  ["/overview", "Overview · Versions · Lifecycle · Tools"],
  ["/interview", "Interview Q&A"],
  ["/cheatsheet", "Cheat sheet"],
] as const;

export default function CourseHeader({ course, tab }: { course: Course; tab: string }) {
  return (
    <>
      <div className="crumbs"><Link href="/roadmap">Roadmap</Link> › {course.track_title} › Step {course.seq}</div>
      <div className="course-head">
        <span className="icon" style={{ background: course.color }}>{course.icon}</span>
        <div>
          <h1>{course.title}</h1>
          <div className="muted">{course.summary}</div>
        </div>
      </div>
      <nav className="tabs">
        {TABS.map(([path, label]) => (
          <Link key={path} href={`/courses/${course.slug}${path}`} className={tab === path ? "active" : ""}>
            {label}{path === "/interview" ? ` (${course.questions})` : ""}
          </Link>
        ))}
      </nav>
    </>
  );
}
