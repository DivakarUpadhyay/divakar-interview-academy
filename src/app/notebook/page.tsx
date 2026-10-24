import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import NotebookPanel from "./NotebookPanel";

export const metadata: Metadata = pageMeta({ title: "My Notebook", description: "Your revise list, important topics, notes and interview-day checklist.", path: "/notebook", noindex: true });

export default function NotebookPage() {
  return (
    <>
      <h1>📒 My Notebook</h1>
      <p className="muted">
        Your own study space: what to revise, what is important, your notes and your interview-day checklist. Use the small buttons
        under every lesson and answer to send things here.
      </p>
      <NotebookPanel />
    </>
  );
}
