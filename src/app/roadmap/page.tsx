import type { Metadata } from "next";
import Link from "next/link";
import { getCourses, getSyllabus, getTracks } from "@/lib/db";
import { Grade, Legend, Priority } from "@/components/Badges";
import { DoneMark } from "@/components/LessonDone";

export const metadata: Metadata = { title: "Roadmap & syllabus" };

export default function Roadmap() {
  const tracks = getTracks();
  const courses = getCourses();
  return (
    <>
      <h1>Roadmap &amp; full syllabus</h1>
      <p className="muted">
        Track → Course → Module → Lesson, in the order to study them. Each lesson is graded Basic, Intermediate or Advanced
        and tagged with how often it comes up in interviews.
      </p>
      <Legend />
      {tracks.map((t) => (
        <section key={t.slug} className="track">
          <h2>{t.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{t.summary}</p>
          {courses.filter((c) => c.track_slug === t.slug).map((c) => (
            <details key={c.slug} className="panel">
              <summary>
                <span className="muted">{c.seq}.</span> {c.title}
                <span className="spacer" />
                <span className="muted small">{c.lessons} lessons · {c.questions} Q&amp;A</span>
              </summary>
              <div className="panel-body">
                <p className="muted small" style={{ marginTop: 0 }}>{c.summary} <Link href={`/courses/${c.slug}`}>Open course →</Link></p>
                {getSyllabus(c.id).map((m) => (
                  <div key={m.id} className="module">
                    <h3>{c.seq}.{m.ord} {m.title}</h3>
                    <ul className="lesson-list">
                      {m.lessons.map((l, i) => (
                        <li key={l.id}>
                          <span className="num">{c.seq}.{m.ord}.{i + 1}</span>
                          <Link href={`/courses/${c.slug}/lessons/${l.slug}`}>{l.title}</Link>
                          <DoneMark id={`${c.slug}/${l.slug}`} />
                          <span className="spacer" />
                          <Grade g={l.grade} /> <Priority p={l.priority} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
