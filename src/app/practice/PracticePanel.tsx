"use client";
import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/db";
import { Chips, LEVELS, PRIORITIES } from "@/components/QuestionList";
import { Level, Priority } from "@/components/Badges";
import { useStored } from "@/lib/progress";

type C = { slug: string; title: string; track_slug: string; questions: number };
type Rating = "good" | "partial" | "miss";
type Session = { at: string; topics: string; total: number; good: number; partial: number; miss: number };

const RATING_LABEL: Record<Rating, string> = { good: "✓ Answered well", partial: "~ Partly", miss: "✗ Didn't know" };

export default function PracticePanel({ tracks, courses }: { tracks: { slug: string; title: string }[]; courses: C[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [prios, setPrios] = useState<string[]>(["High"]);
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(120);
  const [speak, setSpeak] = useState(false);

  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [left, setLeft] = useState(0);
  const [phase, setPhase] = useState<"setup" | "run" | "done">("setup");
  const [error, setError] = useState("");
  const [history, setHistory] = useStored<Session[]>("practice-history", []);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = queue[idx];

  useEffect(() => {
    if (phase !== "run" || !current) return;
    setLeft(seconds);
    if (speak && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(current.question));
    }
    if (seconds > 0) {
      timer.current = setInterval(() => setLeft((s) => s - 1), 1000);
      return () => { if (timer.current) clearInterval(timer.current); };
    }
  }, [phase, idx, current, seconds, speak]);

  const start = async (questions?: Question[]) => {
    setError("");
    let qs = questions;
    if (!qs) {
      const p = new URLSearchParams({ count: String(count) });
      if (picked.length) p.set("course", picked.join(","));
      if (levels.length) p.set("level", levels.join(","));
      if (prios.length) p.set("priority", prios.join(","));
      const d = await fetch(`/api/questions/random?${p}`).then((r) => r.json());
      qs = d.items as Question[];
    }
    if (!qs.length) { setError("No questions match these filters. Remove a filter and try again."); return; }
    setQueue(qs); setIdx(0); setRatings({}); setRevealed(false); setPhase("run");
  };

  const rate = (r: Rating) => {
    const next = { ...ratings, [current.id]: r };
    setRatings(next);
    setRevealed(false);
    if (idx + 1 < queue.length) setIdx(idx + 1);
    else finish(next);
  };

  const finish = (final: Record<number, Rating>) => {
    if (timer.current) clearInterval(timer.current);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const vals = Object.values(final);
    const s: Session = {
      at: new Date().toLocaleString(),
      topics: picked.length ? picked.map((p) => courses.find((c) => c.slug === p)?.title ?? p).join(", ") : "All courses",
      total: vals.length, good: vals.filter((v) => v === "good").length,
      partial: vals.filter((v) => v === "partial").length, miss: vals.filter((v) => v === "miss").length,
    };
    if (s.total) setHistory([s, ...history].slice(0, 20));
    setPhase("done");
  };

  if (phase === "run" && current) {
    return (
      <div className="card">
        <div className="row">
          <span className="muted">Question {idx + 1} of {queue.length}</span>
          <span className="badge course">{current.course_title}</span>
          <Level l={current.level} /> <Priority p={current.priority} />
          <span className="spacer" />
          {seconds > 0 && <span className={`timer ${left < 0 ? "late" : ""}`}>{left < 0 ? "-" : ""}{fmt(Math.abs(left))}</span>}
        </div>
        <div className="progress" style={{ margin: "10px 0 16px" }}><div style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
        <h2 style={{ marginTop: 0 }} dangerouslySetInnerHTML={{ __html: current.question_html }} />
        {!revealed ? (
          <>
            <p className="muted">Answer out loud as you would in the interview: definition → how it works → example → when you used it.</p>
            <div className="row">
              <button className="btn primary" onClick={() => setRevealed(true)}>Reveal model answer</button>
              <button className="btn" onClick={() => finish(ratings)}>End session</button>
            </div>
          </>
        ) : (
          <>
            <div className="prose" style={{ borderTop: "1px dashed var(--border)", paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: current.answer_html }} />
            <p className="muted">How did you do?</p>
            <div className="row">
              {(Object.keys(RATING_LABEL) as Rating[]).map((r) => (
                <button key={r} className={`btn ${r === "good" ? "primary" : ""}`} onClick={() => rate(r)}>{RATING_LABEL[r]}</button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase === "done") {
    const vals = Object.values(ratings);
    const score = vals.length ? Math.round(((vals.filter((v) => v === "good").length + vals.filter((v) => v === "partial").length * 0.5) / vals.length) * 100) : 0;
    const weak = queue.filter((q) => ratings[q.id] && ratings[q.id] !== "good");
    const byCourse = new Map<string, { total: number; good: number }>();
    for (const q of queue) {
      if (!ratings[q.id]) continue;
      const e = byCourse.get(q.course_title) ?? { total: 0, good: 0 };
      e.total++; if (ratings[q.id] === "good") e.good++;
      byCourse.set(q.course_title, e);
    }
    return (
      <>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Score: {score}%</h2>
          <p className="muted">{vals.length} answered · {vals.filter((v) => v === "good").length} well · {vals.filter((v) => v === "partial").length} partly · {vals.filter((v) => v === "miss").length} missed</p>
          <div className="table-wrap"><table>
            <thead><tr><th>Course</th><th>Answered well</th></tr></thead>
            <tbody>{[...byCourse].map(([c, e]) => <tr key={c}><td>{c}</td><td>{e.good} / {e.total}</td></tr>)}</tbody>
          </table></div>
          <div className="row">
            {weak.length > 0 && <button className="btn primary" onClick={() => start(weak)}>Retry the {weak.length} weak questions</button>}
            <button className="btn" onClick={() => start()}>New random set</button>
            <button className="btn" onClick={() => setPhase("setup")}>Change topics</button>
          </div>
        </div>
        {weak.length > 0 && <h2>Revise these</h2>}
        {weak.map((q) => (
          <details key={q.id} className="panel">
            <summary><span dangerouslySetInnerHTML={{ __html: q.question_html }} /> <span className="spacer" /> <span className="badge course">{q.course_title}</span></summary>
            <div className="panel-body prose" dangerouslySetInnerHTML={{ __html: q.answer_html }} />
          </details>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>1. Topics</h3>
        <p className="muted small" style={{ marginTop: 0 }}>Nothing ticked = all courses.</p>
        {tracks.map((t) => (
          <div key={t.slug} style={{ marginBottom: 10 }}>
            <div className="small" style={{ fontWeight: 600 }}>{t.title}</div>
            <div className="row" style={{ gap: 6 }}>
              {courses.filter((c) => c.track_slug === t.slug).map((c) => (
                <button key={c.slug} className={`chip ${picked.includes(c.slug) ? "on" : ""}`}
                  onClick={() => setPicked(picked.includes(c.slug) ? picked.filter((p) => p !== c.slug) : [...picked, c.slug])}>{c.title}</button>
              ))}
            </div>
          </div>
        ))}
        <h3>2. Level and priority</h3>
        <div className="row"><Chips values={LEVELS} selected={levels} onChange={setLevels} /> <Chips values={PRIORITIES} selected={prios} onChange={setPrios} colored /></div>
        <h3>3. Session</h3>
        <div className="row">
          <label className="check">Questions <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value) || 10)} style={{ width: 80 }} /></label>
          <label className="check">Seconds per question (0 = no timer) <input type="number" min={0} max={900} value={seconds} onChange={(e) => setSeconds(Number(e.target.value) || 0)} style={{ width: 90 }} /></label>
          <label className="check"><input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} /> Read questions aloud like an interviewer</label>
        </div>
        {error && <p style={{ color: "var(--high)" }}>{error}</p>}
        <div className="row" style={{ marginTop: 14 }}><button className="btn primary" onClick={() => start()}>Start mock interview</button></div>
      </div>
      {history.length > 0 && (
        <>
          <h2>Your recent sessions</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>When</th><th>Topics</th><th>Well</th><th>Partly</th><th>Missed</th></tr></thead>
            <tbody>{history.map((h, i) => <tr key={i}><td>{h.at}</td><td>{h.topics}</td><td>{h.good}</td><td>{h.partial}</td><td>{h.miss}</td></tr>)}</tbody>
          </table></div>
        </>
      )}
    </>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
