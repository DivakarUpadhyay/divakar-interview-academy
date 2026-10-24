"use client";
import { useState } from "react";
import { useNotebook, type NoteItem } from "@/lib/notebook";

/** Small toolbar under a lesson or an answer: revise later, importance, interview-day checklist, personal note. */
export default function StudyActions({ item }: { item: Omit<NoteItem, "updated"> }) {
  const { items, update } = useNotebook();
  const cur = items[item.key];
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const set = (change: Partial<NoteItem>) => update(item, change);
  const nextImportance = cur?.importance === "important" ? "less" : cur?.importance === "less" ? "" : "important";

  return (
    <div className="study-actions">
      <button className={`chip${cur?.revise ? " on" : ""}`} onClick={() => set({ revise: !cur?.revise })}
        title="Add to your revise list">↻ {cur?.revise ? "To revise" : "Revise later"}</button>
      <button className={`chip imp-${cur?.importance || "none"}${cur?.importance ? " on" : ""}`} onClick={() => set({ importance: nextImportance })}
        title="Tap to cycle: Important → Less important → none">
        {cur?.importance === "important" ? "★ Important" : cur?.importance === "less" ? "▽ Less important" : "☆ Mark importance"}
      </button>
      <button className={`chip${cur?.interviewDay ? " on" : ""}`} onClick={() => set({ interviewDay: !cur?.interviewDay, checked: false })}
        title="Add to your interview-day checklist">📋 {cur?.interviewDay ? "On interview-day list" : "Interview day"}</button>
      <button className={`chip${cur?.note ? " on" : ""}`} onClick={() => { setText(cur?.note ?? ""); setEditing(!editing); }}>
        📝 {cur?.note ? "My note" : "Add note"}
      </button>
      {editing && (
        <div className="note-editor">
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your own words, a trick to remember, where you used it…" autoFocus />
          <div className="row">
            <button className="btn small primary" onClick={() => { set({ note: text }); setEditing(false); }}>Save note</button>
            <button className="btn small" onClick={() => setEditing(false)}>Cancel</button>
            {cur?.note && <button className="btn small" onClick={() => { set({ note: "" }); setEditing(false); }}>Delete note</button>}
          </div>
        </div>
      )}
      {!editing && cur?.note && <div className="note-view">📝 {cur.note}</div>}
    </div>
  );
}
