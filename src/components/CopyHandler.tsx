"use client";
import { useEffect } from "react";

/** One document-level listener for the "Copy" buttons rendered inside code blocks. */
export default function CopyHandler() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
      if (!btn) return;
      const code = btn.parentElement?.querySelector("code")?.textContent ?? "";
      navigator.clipboard?.writeText(code).then(() => {
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
