"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { MenuLink, MenuTrack } from "@/lib/menu";

// Tutorialsteacher-style menu bar: one mega menu per subject (columns = groups, basics → advanced), then practice and more.
const PRACTICE = [
  ["/notebook", "📒 My Notebook", "Revise list, important topics, notes, interview-day checklist"],
  ["/practice", "Mock Interview Test", "Timed random questions, then self-score"],
  ["/interview", "All Interview Q&A", "Filter every question by course, level and priority"],
  ["/cheatsheets", "Cheat Sheets", "One-page revision for every course"],
  ["/interview-day", "Interview Day Checklist", "What to do before and during the interview"],
  ["/demo", "Demo Kit", "Run JavaScript and SQL live in the browser"],
] as const;
const MORE = [
  ["/roadmap", "Roadmap & Syllabus"],
  ["/courses", "All Courses"],
  ["/search", "Search"],
  ["/api-docs", "REST API"],
] as const;

export default function SiteNav({ menu }: { menu: MenuTrack[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<string | null>(null);
  useEffect(() => { setOpen(false); setDrop(null); }, [path]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  };
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  const trackActive = (t: MenuTrack) => t.groups.some((g) => g.links.some((l) => isActive(l.href)));
  const itemProps = (key: string, mega = false) => ({
    className: `menu-item${mega ? " mega" : ""}${drop === key ? " show" : ""}`,
    onMouseLeave: () => setDrop((d) => (d === key ? null : d)),
  });
  const trigger = (key: string, label: string, active: boolean) => (
    <button type="button" className={`menu-link${active ? " active" : ""}`} aria-expanded={drop === key}
      onClick={() => setDrop(drop === key ? null : key)}>
      {label} <span className="caret">▾</span>
    </button>
  );
  const link = (l: MenuLink) => (
    <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
      <span className="mini-icon" style={{ background: l.color }}>{l.icon}</span>
      <span>{l.title}</span>
    </Link>
  );

  return (
    <>
      <div className="topbar container">
        <Link href="/" className="brand">
          <span className="brand-mark">DL</span>
          <span>Dev<span className="brand-accent">Ladder</span></span>
        </Link>
        <form className="top-search" action="/search" role="search">
          <input type="search" name="q" placeholder="Search tutorials, questions, cheat sheets…" aria-label="Search" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <Link href="/notebook" className={`notebook-btn${isActive("/notebook") ? " active" : ""}`} title="My Notebook — revise list, notes, interview-day checklist">📒 <span>My Notebook</span></Link>
        <button className="theme-btn" onClick={toggleTheme} title="Toggle dark mode">◐</button>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">☰</button>
      </div>
      <nav className={`menubar${open ? " open" : ""}`} aria-label="Main">
        <div className="container menu">
          <Link href="/" className={`menu-link home${path === "/" ? " active" : ""}`} title="Home">⌂</Link>
          {menu.map((t) => {
            const mega = t.groups.length > 1;
            return (
              <div key={t.slug} {...itemProps(t.slug, mega)}>
                {trigger(t.slug, t.label, trackActive(t))}
                <div className="dropdown">
                  {mega && <div className="drop-title">{t.title} <span className="hint">— basics to advanced, left to right</span></div>}
                  <div className="drop-cols">
                    {t.groups.map((g, i) => (
                      <div key={g.title} className="drop-col">
                        <div className="drop-group">{mega ? `${i + 1}. ` : ""}{g.title}</div>
                        {g.links.map(link)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div {...itemProps("practice")}>
            {trigger("practice", "Practice", PRACTICE.some(([h]) => isActive(h)))}
            <div className="dropdown right wide">
              {PRACTICE.map(([href, label, hint]) => (
                <Link key={href} href={href} className={isActive(href) ? "active" : ""}>
                  <span><b>{label}</b><br /><span className="hint">{hint}</span></span>
                </Link>
              ))}
            </div>
          </div>
          <div {...itemProps("more")}>
            {trigger("more", "More", MORE.some(([h]) => path === h))}
            <div className="dropdown right">
              {MORE.map(([href, label]) => (
                <Link key={href} href={href} className={path === href ? "active" : ""}>{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
