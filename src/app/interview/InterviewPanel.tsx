"use client";
import { useEffect, useState } from "react";
import type { Question } from "@/lib/db";
import { Chips, LEVELS, PRIORITIES, QuestionCard } from "@/components/QuestionList";
import { Legend } from "@/components/Badges";
import { useBookmarks } from "@/lib/progress";

type C = { slug: string; title: string; track_slug: string; questions: number };
const PAGE = 40;

export default function InterviewPanel({ tracks, courses }: { tracks: { slug: string; title: string }[]; courses: C[] }) {
  const [course, setCourse] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [prios, setPrios] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [marks] = useBookmarks();
  const [onlyMarked, setOnlyMarked] = useState(false);

  // debounce the search box
  useEffect(() => { const t = setTimeout(() => setQuery(text), 300); return () => clearTimeout(t); }, [text]);

  const params = (offset: number) => {
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(offset) });
    if (course) p.set("course", course);
    if (levels.length) p.set("level", levels.join(","));
    if (prios.length) p.set("priority", prios.join(","));
    if (query.trim()) p.set("q", query.trim());
    return p;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/questions?${params(0)}`).then((r) => r.json()).then((d) => {
      if (cancelled) return;
      setItems(d.items); setTotal(d.total); setOpen(new Set()); setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, levels, prios, query]);

  const more = async () => {
    setLoading(true);
    const d = await fetch(`/api/questions?${params(items.length)}`).then((r) => r.json());
    setItems((x) => [...x, ...d.items]);
    setLoading(false);
  };

  const shown = onlyMarked ? items.filter((q) => marks.includes(q.id)) : items;
  const toggle = (id: number) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <>
      <div className="filters">
        <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course">
          <option value="">All courses</option>
          {tracks.map((t) => (
            <optgroup key={t.slug} label={t.title}>
              {courses.filter((c) => c.track_slug === t.slug).map((c) => <option key={c.slug} value={c.slug}>{c.title} ({c.questions})</option>)}
            </optgroup>
          ))}
        </select>
        <input type="search" placeholder="Search questions and answers…" value={text} onChange={(e) => setText(e.target.value)} />
        <Chips values={LEVELS} selected={levels} onChange={setLevels} />
        <Chips values={PRIORITIES} selected={prios} onChange={setPrios} colored />
        <label className="check"><input type="checkbox" checked={onlyMarked} onChange={(e) => setOnlyMarked(e.target.checked)} /> Bookmarked</label>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="muted small">{loading ? "Loading…" : `${total} matching questions`} — sorted by course, then High → Low priority</span>
        <span className="spacer" />
        <button className="btn small" onClick={() => setOpen(new Set(shown.map((q) => q.id)))}>Show answers</button>
        <button className="btn small" onClick={() => setOpen(new Set())}>Hide answers</button>
      </div>
      <Legend />
      <div style={{ marginTop: 10 }}>
        {shown.map((q, i) => <QuestionCard key={q.id} q={q} n={i + 1} open={open.has(q.id)} onToggle={() => toggle(q.id)} showCourse />)}
      </div>
      {items.length < total && !onlyMarked && (
        <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
          <button className="btn" onClick={more} disabled={loading}>Load more ({total - items.length} left)</button>
        </div>
      )}
    </>
  );
}
