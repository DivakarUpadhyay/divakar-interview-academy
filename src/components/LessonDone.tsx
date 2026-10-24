"use client";
import { useDoneLessons } from "@/lib/progress";

export function LessonDoneToggle({ id }: { id: string }) {
  const [done, setDone] = useDoneLessons();
  const isDone = done.includes(id);
  return (
    <button className={`btn ${isDone ? "" : "primary"}`} onClick={() => setDone(isDone ? done.filter((d) => d !== id) : [...done, id])}>
      {isDone ? "✓ Completed — mark as not done" : "Mark lesson as completed"}
    </button>
  );
}

export function DoneMark({ id }: { id: string }) {
  const [done] = useDoneLessons();
  return done.includes(id) ? <span className="done-mark" title="Completed">✓</span> : null;
}

export function CourseProgress({ ids }: { ids: string[] }) {
  const [done] = useDoneLessons();
  const n = ids.filter((id) => done.includes(id)).length;
  const pct = ids.length ? Math.round((n / ids.length) * 100) : 0;
  return (
    <div style={{ minWidth: 220 }}>
      <div className="small muted">{n} of {ids.length} lessons completed ({pct}%)</div>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/** Thin progress bar for a course tile: share of the course's lessons marked completed. */
export function TileProgress({ slug, total }: { slug: string; total: number }) {
  const [done] = useDoneLessons();
  const n = done.filter((d) => d.startsWith(slug + "/")).length;
  if (!total) return null;
  const pct = Math.round((n / total) * 100);
  return (
    <span className="tile-progress" title={`${n} of ${total} lessons completed`}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}
