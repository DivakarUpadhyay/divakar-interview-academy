"use client";
import Link from "next/link";
import { useState } from "react";
import { useDoneLessons, useKnown, useNotebook, type NoteItem } from "@/lib/notebook";

const TABS = [
  ["checklist", "📋 Interview day"],
  ["revise", "↻ To revise"],
  ["important", "★ Important"],
  ["notes", "📝 Notes"],
  ["learned", "✓ Learned"],
] as const;
type Tab = (typeof TABS)[number][0];

const pretty = (slug: string) => slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const confirmed = (msg: string) => typeof window !== "undefined" && window.confirm(msg);

export default function NotebookPanel() {
  const nb = useNotebook();
  const [done, setDone] = useDoneLessons();
  const [known, setKnown] = useKnown();
  const [tab, setTab] = useState<Tab>("checklist");
  const [draft, setDraft] = useState("");

  const checklist = nb.list.filter((i) => i.interviewDay);
  const revise = nb.list.filter((i) => i.revise);
  const important = nb.list.filter((i) => i.importance === "important");
  const less = nb.list.filter((i) => i.importance === "less");
  const notes = nb.list.filter((i) => (i.kind === "note" && !i.listOnly) || i.note?.trim());
  const counts: Record<Tab, number> = { checklist: checklist.length, revise: revise.length, important: important.length, notes: notes.length, learned: done.length + known.length };

  const add = (interviewDay: boolean) => { if (draft.trim()) { nb.addNote(draft, interviewDay); setDraft(""); } };

  return (
    <>
      <div className="nb-stats">
        {TABS.map(([key, label]) => (
          <button key={key} className={`nb-stat${tab === key ? " on" : ""}`} onClick={() => setTab(key)}>
            <b>{counts[key]}</b><span>{label}</span>
          </button>
        ))}
      </div>

      {tab === "checklist" && <Checklist />}

      {tab === "revise" && (
        <ListSection title="↻ To revise" empty="Tap “↻ Revise later” under a lesson or answer to collect topics here." items={revise}
          action={(i) => <button className="btn small" onClick={() => nb.update(i, { revise: false })}>✓ Revised</button>}
          onClear={() => confirmed("Empty the revise list?") && nb.clearFlag("revise")} clearLabel="Clear revise list" />
      )}

      {tab === "important" && (
        <>
          <ListSection title="★ Important" empty="Tap “☆ Mark importance” once to mark a topic as important." items={important}
            action={(i) => <button className="btn small" onClick={() => nb.update(i, { importance: "less" })}>Move to less important</button>} />
          <ListSection title="▽ Less important" empty="Tap the importance button twice to mark something as less important." items={less}
            action={(i) => <button className="btn small" onClick={() => nb.update(i, { importance: "important" })}>Move to important</button>}
            onClear={() => confirmed("Remove all importance tags?") && nb.clearFlag("importance")} clearLabel="Clear all importance tags" />
        </>
      )}

      {tab === "notes" && (
        <section className="card">
          <h2 className="nb-h">📝 My notes</h2>
          <AddBox draft={draft} setDraft={setDraft} onAdd={() => add(false)} placeholder="Write a note — what you learned, a trick, a question to ask…" multiline />
          {notes.length === 0 && <Empty text="No notes yet. Add one above, or use “📝 Add note” under any lesson or answer." />}
          <div className="nb-notes">
            {notes.map((i) => (
              <div key={i.key} className="nb-note">
                {i.kind === "note" ? <p>{i.title}</p> : <><ItemTitle i={i} /><p>{i.note}</p></>}
                <div className="row">
                  <span className="muted small">{new Date(i.updated).toLocaleDateString()}</span>
                  <span className="spacer" />
                  {!i.interviewDay && <button className="link-btn" onClick={() => nb.update(i, { interviewDay: true, checked: false })}>📋 Move to interview day</button>}
                  <button className="link-btn" onClick={() => (i.kind === "note" ? nb.remove(i.key) : nb.update(i, { note: "" }))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "learned" && (
        <section className="card">
          <h2 className="nb-h">✓ What I have learned</h2>
          <p><b>{done.length}</b> lessons completed · <b>{known.length}</b> interview questions marked “I know this”.</p>
          {done.length > 0 && (
            <details className="panel"><summary>Completed lessons ({done.length})</summary>
              <ul className="nb-list panel-body">
                {done.map((id) => {
                  const [course, lesson] = id.split("/");
                  return (
                    <li key={id}>
                      <Link href={`/courses/${course}/lessons/${lesson}`}>{pretty(lesson)}</Link> <span className="muted small">— {pretty(course)}</span>
                      <span className="spacer" />
                      <button className="link-btn" onClick={() => setDone(done.filter((d) => d !== id))}>Unmark</button>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn small" disabled={!done.length} onClick={() => confirmed("Reset all completed lessons?") && setDone([])}>Reset learned lessons</button>
            <button className="btn small" disabled={!known.length} onClick={() => confirmed("Reset all “I know this” questions?") && setKnown([])}>Reset known questions</button>
          </div>
        </section>
      )}

      <div className="row nb-reset">
        <span className="muted small">Everything is saved in this browser only.</span>
        <span className="spacer" />
        <button className="btn small" onClick={() => {
          if (confirmed("Reset EVERYTHING — notebook, checklist, learned lessons and known questions?")) { nb.resetAll(); setDone([]); setKnown([]); }
        }}>Reset everything</button>
      </div>
    </>
  );
}

function ItemTitle({ i }: { i: NoteItem }) {
  const tag = i.kind === "question" ? "Q" : i.kind === "lesson" ? "Lesson" : "Note";
  return (
    <span className="nb-title">
      <span className="badge level">{tag}</span>{" "}
      {i.href ? <Link href={i.href}>{i.title}</Link> : i.title}
      {i.course && <span className="muted small"> — {i.course}</span>}
    </span>
  );
}

function ListSection({ title, empty, items, action, onClear, clearLabel }: {
  title: string; empty: string; items: NoteItem[]; action: (i: NoteItem) => React.ReactNode; onClear?: () => void; clearLabel?: string;
}) {
  return (
    <section className="card" style={{ marginBottom: 12 }}>
      <h2 className="nb-h">{title} <span className="muted small">({items.length})</span></h2>
      {items.length === 0 && <Empty text={empty} />}
      <ul className="nb-list">
        {items.map((i) => <li key={i.key}><ItemTitle i={i} /><span className="spacer" />{action(i)}</li>)}
      </ul>
      {onClear && items.length > 0 && <button className="btn small" onClick={onClear}>{clearLabel}</button>}
    </section>
  );
}

function AddBox({ draft, setDraft, onAdd, placeholder, multiline }: {
  draft: string; setDraft: (s: string) => void; onAdd: () => void; placeholder: string; multiline?: boolean;
}) {
  return (
    <div className="nb-add">
      {multiline
        ? <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        : <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAdd()} placeholder={placeholder} />}
      <button className="btn primary" onClick={onAdd} disabled={!draft.trim()}>Add</button>
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="muted small nb-empty">{text}</p>;

/** The interview-day checklist: items sent from lessons/questions plus the user's own entries. */
export function Checklist() {
  const nb = useNotebook();
  const [draft, setDraft] = useState("");
  const checklist = nb.list.filter((i) => i.interviewDay);
  const add = (interviewDay: boolean) => { if (draft.trim()) { nb.addNote(draft, interviewDay); setDraft(""); } };
  return (
    <section className="card">
          <div className="row">
            <h2 className="nb-h">📋 My interview-day checklist</h2>
            <span className="spacer" />
            <span className="muted small">{checklist.filter((i) => i.checked).length} of {checklist.length} ticked</span>
          </div>
          <p className="muted small">Add anything you want to read once more on the day — from any lesson or question (tap “📋 Interview day”) or type your own.</p>
          <AddBox draft={draft} setDraft={setDraft} onAdd={() => add(true)} placeholder="e.g. Revise my project numbers, test the camera, bring ID…" />
          {checklist.length === 0 && <Empty text="Nothing here yet. Tap “📋 Interview day” under any lesson or answer." />}
          <ul className="nb-list">
            {checklist.map((i) => (
              <li key={i.key} className={i.checked ? "checked" : ""}>
                <input type="checkbox" checked={!!i.checked} onChange={() => nb.update(i, { checked: !i.checked })} aria-label="Done" />
                <ItemTitle i={i} />
                <span className="spacer" />
                <button className="link-btn" onClick={() => (i.kind === "note" ? nb.remove(i.key) : nb.update(i, { interviewDay: false, checked: false }))}>Remove</button>
              </li>
            ))}
          </ul>
          {checklist.length > 0 && (
            <div className="row">
              <button className="btn small" onClick={() => nb.clearFlag("checked")}>Untick all</button>
              <button className="btn small" onClick={() => confirmed("Remove everything from the interview-day checklist?") && nb.clearFlag("interviewDay")}>Clear checklist</button>
            </div>
          )}
        </section>
  );
}

/** Copies a list of standard plan items into the user's interview-day checklist (skips ones already there). */
export function AddToChecklist({ texts }: { texts: string[] }) {
  const nb = useNotebook();
  const have = new Set(nb.list.filter((i) => i.interviewDay).map((i) => i.title));
  const missing = texts.filter((t) => !have.has(t));
  if (!missing.length) return <span className="muted small">✓ In your checklist</span>;
  return (
    <button className="btn small" onClick={() => nb.addMany(missing)}>+ Add to my checklist</button>
  );
}
