import type { Metadata } from "next";
import Link from "next/link";
import { getCheats, getCourses, getTracks } from "@/lib/db";
import Prose from "@/components/Prose";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = { title: "Cheat sheets — quick interview revision" };

export default function CheatSheets() {
  const tracks = getTracks();
  const courses = getCourses();
  return (
    <>
      <h1>Cheat sheets</h1>
      <p className="muted">
        Every course condensed for the day of the interview: key definitions, syntax, comparisons and gotchas. Open a single
        course&apos;s sheet to print it, or skim them all here.
      </p>
      <div className="card no-print" style={{ marginBottom: 20 }}>
        {tracks.map((t) => (
          <div key={t.slug} style={{ marginBottom: 8 }}>
            <b className="small">{t.title}</b>
            <div className="row" style={{ gap: 6 }}>
              {courses.filter((c) => c.track_slug === t.slug).map((c) => (
                <span key={c.slug} className="row" style={{ gap: 2 }}>
                  <a className="chip" href={`#${c.slug}`}>{c.title}</a>
                  <Link className="small" href={`/courses/${c.slug}/cheatsheet`} title="Printable page">⎙</Link>
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="row"><span className="spacer" /><PrintButton /></div>
      </div>
      {courses.map((c) => (
        <section key={c.slug} id={c.slug} style={{ scrollMarginTop: 80 }}>
          <h2><span className="muted">{c.seq}.</span> {c.title}</h2>
          {getCheats(c.id).map((s) => (
            <details key={s.id} className="panel">
              <summary>{s.title}</summary>
              <div className="panel-body"><Prose html={s.body_html} /></div>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
