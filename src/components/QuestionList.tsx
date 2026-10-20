"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Question } from "@/lib/db";
import { useBookmarks } from "@/lib/progress";
import { Legend, Level, Priority } from "./Badges";

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Scenario"];
export const PRIORITIES = ["High", "Medium", "Low"];

export function QuestionCard({ q, n, open, onToggle, showCourse }: {
  q: Question; n: number; open: boolean; onToggle: () => void; showCourse?: boolean;
}) {
  const [marks, setMarks] = useBookmarks();
  const marked = marks.includes(q.id);
  return (
    <div className={`q-card ${q.priority}`}>
      <div className="q-head" onClick={onToggle} role="button" aria-expanded={open}>
        <span className="q-num">{n}.</span>
        <span className="q-text" dangerouslySetInnerHTML={{ __html: q.question_html }} />
        <span className="q-tags">
          {showCourse && <Link className="badge course" href={`/courses/${q.course_slug}/interview`} onClick={(e) => e.stopPropagation()}>{q.course_title}</Link>}
          <Level l={q.level} />
          <Priority p={q.priority} />
          <button
            className="chip"
            title={marked ? "Remove bookmark" : "Bookmark for revision"}
            onClick={(e) => { e.stopPropagation(); setMarks(marked ? marks.filter((m) => m !== q.id) : [...marks, q.id]); }}
          >{marked ? "★" : "☆"}</button>
        </span>
      </div>
      {open && <div className="q-body prose" dangerouslySetInnerHTML={{ __html: q.answer_html }} />}
    </div>
  );
}

export function Chips({ values, selected, onChange, colored }: {
  values: string[]; selected: string[]; onChange: (v: string[]) => void; colored?: boolean;
}) {
  return (
    <span className="row" style={{ gap: 6 }}>
      {values.map((v) => (
        <button key={v} className={`chip ${colored ? v : ""} ${selected.includes(v) ? "on" : ""}`}
          onClick={() => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])}>{v}</button>
      ))}
    </span>
  );
}

/** Client-side filtered list for one course's questions. */
export default function QuestionList({ questions, showCourse = false }: { questions: Question[]; showCourse?: boolean }) {
  const [levels, setLevels] = useState<string[]>([]);
  const [prios, setPrios] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [marks] = useBookmarks();

  const shown = useMemo(() => {
    const t = text.trim().toLowerCase();
    return questions.filter((q) =>
      (!levels.length || levels.includes(q.level)) &&
      (!prios.length || prios.includes(q.priority)) &&
      (!onlyMarked || marks.includes(q.id)) &&
      (!t || q.question.toLowerCase().includes(t) || q.answer_html.toLowerCase().includes(t)));
  }, [questions, levels, prios, text, onlyMarked, marks]);

  const toggle = (id: number) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <>
      <div className="filters no-print">
        <input type="search" placeholder="Filter questions…" value={text} onChange={(e) => setText(e.target.value)} />
        <Chips values={LEVELS} selected={levels} onChange={setLevels} />
        <Chips values={PRIORITIES} selected={prios} onChange={setPrios} colored />
        <label className="check"><input type="checkbox" checked={onlyMarked} onChange={(e) => setOnlyMarked(e.target.checked)} /> Bookmarked only</label>
        <span className="spacer" />
        <button className="btn small" onClick={() => setOpen(new Set(shown.map((q) => q.id)))}>Show all answers</button>
        <button className="btn small" onClick={() => setOpen(new Set())}>Hide answers</button>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="muted small">{shown.length} of {questions.length} questions. Click a question to see the answer.</span>
        <span className="spacer" />
        <Legend />
      </div>
      {shown.map((q, i) => (
        <QuestionCard key={q.id} q={q} n={i + 1} open={open.has(q.id)} onToggle={() => toggle(q.id)} showCourse={showCourse} />
      ))}
    </>
  );
}
