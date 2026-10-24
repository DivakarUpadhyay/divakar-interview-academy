"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Question } from "@/lib/db";
import { knownKey, useBookmarks, useKnown } from "@/lib/progress";
import { Ease, Legend, Level, Priority } from "./Badges";
import StudyActions from "./StudyActions";
import { questionKey } from "@/lib/notebook";

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Scenario"];
export const PRIORITIES = ["High", "Medium", "Low"];
const PAGE = 40;

export function QuestionCard({ q, n, open, onToggle, showCourse }: {
  q: Question; n: number; open: boolean; onToggle: () => void; showCourse?: boolean;
}) {
  const [marks, setMarks] = useBookmarks();
  const [known, setKnown] = useKnown();
  const marked = marks.includes(q.id);
  const key = knownKey(q);
  const isKnown = known.includes(key);
  return (
    <div className={`q-card ${q.priority}${isKnown ? " known" : ""}`}>
      <div className="q-head" onClick={onToggle} role="button" aria-expanded={open}>
        <span className="q-num">{n}.</span>
        <span className="q-text" dangerouslySetInnerHTML={{ __html: q.question_html }} />
        <span className="q-tags">
          {showCourse && <Link className="badge course" href={`/courses/${q.course_slug}/interview`} onClick={(e) => e.stopPropagation()}>{q.course_title}</Link>}
          <Level l={q.level} />
          <Ease level={q.level} />
          <Priority p={q.priority} />
          <button
            className="chip"
            title={marked ? "Remove bookmark" : "Bookmark for revision"}
            onClick={(e) => { e.stopPropagation(); setMarks(marked ? marks.filter((m) => m !== q.id) : [...marks, q.id]); }}
          >{marked ? "★" : "☆"}</button>
        </span>
      </div>
      {(
        <div className="q-body" hidden={!open}>
          <div className="prose" dangerouslySetInnerHTML={{ __html: q.answer_html }} />
          <button className={`btn small ${isKnown ? "" : "primary"}`}
            onClick={() => setKnown(isKnown ? known.filter((k) => k !== key) : [...known, key])}>
            {isKnown ? "✓ I know this — undo" : "✓ I know this"}
          </button>
          <StudyActions item={{ key: questionKey(q), kind: "question", title: q.question, href: `/courses/${q.course_slug}/interview`, course: q.course_title }} />
        </div>
      )}
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
export default function QuestionList({ questions, showCourse = false, courses, initialPriorities = [] }: {
  questions: Question[]; showCourse?: boolean; courses?: { slug: string; title: string }[]; initialPriorities?: string[];
}) {
  const [levels, setLevels] = useState<string[]>([]);
  const [prios, setPrios] = useState<string[]>(initialPriorities);
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [hideKnown, setHideKnown] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [marks] = useBookmarks();
  const [known] = useKnown();
  const [limit, setLimit] = useState(PAGE);

  const shown = useMemo(() => {
    const t = text.trim().toLowerCase();
    return questions.filter((q) =>
      (!picked.length || picked.includes(q.course_slug)) &&
      (!levels.length || levels.includes(q.level)) &&
      (!prios.length || prios.includes(q.priority)) &&
      (!onlyMarked || marks.includes(q.id)) &&
      (!t || q.question.toLowerCase().includes(t) || q.answer_html.toLowerCase().includes(t)));
  }, [questions, picked, levels, prios, text, onlyMarked, marks]);
  const visible = hideKnown ? shown.filter((q) => !known.includes(knownKey(q))) : shown;

  const knownCount = shown.filter((q) => known.includes(knownKey(q))).length;
  const pct = shown.length ? Math.round((knownCount / shown.length) * 100) : 0;
  const toggle = (id: number) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <>
      <div className="filters no-print">
        <input type="search" placeholder="Filter questions…" value={text} onChange={(e) => setText(e.target.value)} />
        {courses && courses.length > 1 && (
          <span className="row" style={{ gap: 6, width: "100%" }}>
            {courses.map((c) => (
              <button key={c.slug} className={`chip ${picked.includes(c.slug) ? "on" : ""}`}
                onClick={() => setPicked(picked.includes(c.slug) ? picked.filter((s) => s !== c.slug) : [...picked, c.slug])}>{c.title}</button>
            ))}
          </span>
        )}
        <Chips values={LEVELS} selected={levels} onChange={setLevels} />
        <Chips values={PRIORITIES} selected={prios} onChange={setPrios} colored />
        <label className="check"><input type="checkbox" checked={hideKnown} onChange={(e) => setHideKnown(e.target.checked)} /> Hide ones I know</label>
        <label className="check"><input type="checkbox" checked={onlyMarked} onChange={(e) => setOnlyMarked(e.target.checked)} /> Bookmarked only</label>
        <span className="spacer" />
        <button className="btn small" onClick={() => setOpen(new Set(shown.map((q) => q.id)))}>Show all answers</button>
        <button className="btn small" onClick={() => setOpen(new Set())}>Hide answers</button>
      </div>
      <div className="practice-progress">
        <div className="row">
          <b>You know {knownCount} of {shown.length}</b>
          <span className="muted small">{pct === 100 ? "All done — great work! 🎉" : "Open a question, read the answer, then tap “✓ I know this”."}</span>
        </div>
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="muted small">{shown.length} of {questions.length} questions match the filters.</span>
        <span className="spacer" />
        <Legend />
      </div>
      {visible.slice(0, limit).map((q, i) => (
        <QuestionCard key={q.id} q={q} n={i + 1} open={open.has(q.id)} onToggle={() => toggle(q.id)} showCourse={showCourse} />
      ))}
      {visible.length > limit && (
        <div className="show-more">
          <button className="btn" onClick={() => setLimit(limit + PAGE)}>Show {Math.min(PAGE, visible.length - limit)} more ({visible.length - limit} left)</button>
        </div>
      )}
    </>
  );
}
