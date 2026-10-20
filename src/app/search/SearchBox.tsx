"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Hit = { kind: string; course_slug: string; course_title: string; ref: string; title: string; snippet: string };

const KIND: Record<string, string> = { lesson: "Lesson", question: "Interview Q", cheat: "Cheat sheet", course: "Course" };

function href(h: Hit) {
  if (h.kind === "lesson") return `/courses/${h.course_slug}/lessons/${h.ref}`;
  if (h.kind === "question") return `/courses/${h.course_slug}/interview`;
  if (h.kind === "cheat") return `/courses/${h.course_slug}/cheatsheet`;
  return `/courses/${h.course_slug}/overview`;
}

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const initial = new URLSearchParams(location.search).get("q");
    if (initial) setQ(initial);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      setBusy(true);
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      setHits(r.ok ? await r.json() : []);
      setBusy(false);
      history.replaceState(null, "", `?q=${encodeURIComponent(q)}`);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <input type="search" autoFocus placeholder="e.g. dependency injection, CTE, middleware, useEffect, pod lifecycle…" value={q}
        onChange={(e) => setQ(e.target.value)} style={{ width: "100%", fontSize: "1.05rem", padding: "12px 14px" }} />
      <p className="muted small">{busy ? "Searching…" : q.trim().length >= 2 ? `${hits.length} results` : "Type at least 2 characters."}</p>
      {hits.map((h, i) => (
        <Link key={i} href={href(h)} className="card" style={{ display: "block", marginBottom: 8, color: "var(--text)" }}>
          <div className="row"><span className="badge course">{KIND[h.kind] ?? h.kind}</span><span className="muted small">{h.course_title}</span></div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{h.title}</div>
          <div className="small muted" dangerouslySetInnerHTML={{ __html: h.snippet }} />
        </Link>
      ))}
    </>
  );
}
