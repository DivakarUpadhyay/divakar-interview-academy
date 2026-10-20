import Link from "next/link";
import type { CourseSummary } from "@/lib/db";

export default function CourseCard({ c }: { c: CourseSummary }) {
  return (
    <Link href={`/courses/${c.slug}`} className="card course-card">
      <div className="row">
        <span className="icon" style={{ background: c.color }}>{c.icon}</span>
        <span className="muted small">Step {c.seq}</span>
      </div>
      <h3>{c.title}</h3>
      <span className="muted small">{c.summary}</span>
      <span className="meta">{c.lessons} lessons · {c.questions} interview Q&amp;A · {c.cheats} cheat-sheet sections</span>
    </Link>
  );
}
