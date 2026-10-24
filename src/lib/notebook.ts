"use client";
// "My Notebook": per-browser study marks on lessons and questions, free notes, and the interview-day checklist.
import { knownKey, useDoneLessons, useKnown, useStored } from "@/lib/progress";

export type Importance = "" | "important" | "less";
export type NoteItem = {
  key: string;            // "q::<course>::<question>", "l::<course>/<lesson>" or "n::<timestamp>" for free notes
  kind: "question" | "lesson" | "note";
  title: string;
  href?: string;
  course?: string;
  revise?: boolean;       // "revise later"
  importance?: Importance;
  interviewDay?: boolean; // on the interview-day checklist
  checked?: boolean;      // ticked on the checklist
  note?: string;
  listOnly?: boolean;     // typed straight into the checklist — not a note
  updated: number;
};

export const questionKey = (q: { course_slug: string; question: string }) => `q::${knownKey(q)}`;
export const lessonKey = (courseSlug: string, lessonSlug: string) => `l::${courseSlug}/${lessonSlug}`;

export function useNotebook() {
  const [items, setItems] = useStored<Record<string, NoteItem>>("notebook", {});

  /** Merge a change into an item; items with nothing left to remember are dropped. */
  const update = (base: Omit<NoteItem, "updated">, change: Partial<NoteItem>) => {
    const next = { ...items[base.key], ...base, ...change, updated: Date.now() };
    const empty = !next.revise && !next.importance && !next.interviewDay && !next.note?.trim() && next.kind !== "note";
    const copy = { ...items };
    if (empty) delete copy[base.key]; else copy[base.key] = next;
    setItems(copy);
  };
  const remove = (key: string) => { const copy = { ...items }; delete copy[key]; setItems(copy); };
  const addNote = (text: string, interviewDay = false) => {
    const key = `n::${Date.now()}`;
    setItems({ ...items, [key]: { key, kind: "note", title: text.trim(), interviewDay, listOnly: interviewDay, updated: Date.now() } });
  };
  const addMany = (texts: string[]) => {
    const copy = { ...items };
    texts.forEach((t, i) => { const key = `n::${Date.now()}-${i}`; copy[key] = { key, kind: "note", title: t, interviewDay: true, listOnly: true, updated: Date.now() - i }; });
    setItems(copy);
  };
  /** Clear one flag on every item (e.g. empty the revise list); notes keep their text. */
  const clearFlag = (flag: "revise" | "importance" | "interviewDay" | "checked") => {
    const copy: Record<string, NoteItem> = {};
    for (const [k, v] of Object.entries(items)) {
      const n = { ...v, [flag]: flag === "importance" ? "" : false };
      if (flag === "interviewDay" && n.listOnly) continue;   // checklist-only entries go with the checklist
      if (n.kind === "note" || n.revise || n.importance || n.interviewDay || n.note?.trim()) copy[k] = n;
    }
    setItems(copy);
  };
  const resetAll = () => setItems({});
  return { items, list: Object.values(items).sort((a, b) => b.updated - a.updated), update, remove, addNote, addMany, clearFlag, resetAll };
}

export { useDoneLessons, useKnown };
