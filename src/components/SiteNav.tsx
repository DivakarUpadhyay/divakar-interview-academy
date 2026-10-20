"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  ["/roadmap", "Roadmap & syllabus"],
  ["/courses", "Courses"],
  ["/interview", "Interview Q&A"],
  ["/practice", "Practice"],
  ["/demo", "Demo kit"],
  ["/cheatsheets", "Cheat sheets"],
  ["/interview-day", "Interview day"],
  ["/search", "Search"],
] as const;

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  };
  return (
    <>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>Menu</button>
      <nav className={`nav${open ? " open" : ""}`} onClick={() => setOpen(false)}>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href || path.startsWith(href + "/") ? "active" : ""}>{label}</Link>
        ))}
        <button className="theme-btn" onClick={toggleTheme} title="Toggle dark mode">◐</button>
      </nav>
    </>
  );
}
