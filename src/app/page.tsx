import Link from "next/link";
import { getCourses, getStats, getTracks } from "@/lib/db";
import { buildMenu } from "@/lib/menu";
import { TileProgress } from "@/components/LessonDone";

const PREP = [
  ["/interview", "Q&A", "#3b5bdb", "Interview Q&A"],
  ["/practice", "Test", "#e8590c", "Mock Interview Test"],
  ["/cheatsheets", "CS", "#2b8a3e", "Cheat Sheets"],
  ["/interview-day", "Day", "#a61e4d", "Interview Day Checklist"],
  ["/roadmap", "Map", "#0b7285", "Roadmap & Syllabus"],
  ["/demo", "Run", "#5f3dc4", "Demo Kit (JS & SQL)"],
] as const;

export default function Home() {
  const menu = buildMenu(getTracks(), getCourses());
  const s = getStats();
  return (
    <>
      <section className="start-strip">
        <div className="start-text">
          <h1>Learn it. Practise it. Crack the interview.</h1>
          <p>Short lessons with real examples, from basics to advanced, then the questions interviewers actually ask, with the must-know ones marked.</p>
        </div>
        <div className="start-cards">
          <Link href="/courses/computer-fundamentals" className="start-card">
            <span className="start-emoji">📘</span><b>Start learning</b><span>Begin with the fundamentals and go step by step</span>
          </Link>
          <Link href="/interview-questions" className="start-card">
            <span className="start-emoji">🎯</span><b>Practise for your role</b><span>.NET full stack, automation, Industry 4.0 …</span>
          </Link>
          <Link href="/practice" className="start-card">
            <span className="start-emoji">⏱️</span><b>10-minute mock test</b><span>Random questions against the clock</span>
          </Link>
        </div>
      </section>
      <section className="popular">
        <h2 className="home-title">Popular on DevLadder</h2>
        <div className="popular-grid">
          <Link href="/tools" className="card popular-card"><b>🛠️ Free developer tools</b><span>JSON and SQL formatter, regex tester, JWT decoder. Nothing is uploaded.</span></Link>
          <Link href="/errors" className="card popular-card"><b>🩹 Fix common errors</b><span>SQL Server, EF Core, ASP.NET Core and Docker errors explained, with fixes.</span></Link>
          <Link href="/interview-prep-pack" className="card popular-card"><b>📕 Interview Prep Pack</b><span>237 must-know .NET questions, cheat sheets and a 30-day plan in one PDF.</span></Link>
          <Link href="/mentoring" className="card popular-card"><b>🎤 Mock interview</b><span>Practise one to one with a .NET developer and get honest feedback.</span></Link>
        </div>
      </section>
      <h2 className="home-title">Learn Programming</h2>
      <p className="home-sub">Follow the steps in order. Each subject goes from basics to advanced, and the bar shows your progress.</p>
      {menu.map((t) => {
        const row = (l: (typeof t.groups)[number]["links"][number]) => (
          <Link key={l.href} href={l.href} className="course-row">
            <span className="tile-icon" style={{ background: l.color }}>{l.icon}</span>
            <span className="course-row-text">
              <span className="tile-name">{l.title}</span>
              {l.slug && <TileProgress slug={l.slug} total={l.lessons ?? 0} />}
            </span>
          </Link>
        );
        return (
          <section key={t.slug} className="tile-section">
            <h2>{t.title}</h2>
            {t.groups.length > 1 ? (
              <div className="step-grid">
                {t.groups.map((g, i) => (
                  <div key={g.title} className="step-card">
                    <div className="step-head"><span className="step-num">{i + 1}</span>{g.title}</div>
                    {g.links.map(row)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="row-grid">{t.groups.flatMap((g) => g.links.map(row))}</div>
            )}
          </section>
        );
      })}

      <section className="tile-section">
        <h2>Practice</h2>
        <div className="tiles">
          {PREP.map(([href, icon, color, label]) => (
            <Link key={href} href={href} className="tile">
              <span className="tile-icon" style={{ background: color }}>{icon}</span>
              <span className="tile-name">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-intro">
        <h2>About DevLadder</h2>
        <p>
          I built DevLadder after nine years of working as a .NET developer, because I kept seeing the same thing in interviews:
          people knew the tools but couldn&apos;t explain the basics behind them. So every course here starts simple and climbs one step at
          a time, from how a computer works to C#, ASP.NET Core, SQL Server, the cloud and front-end frameworks.
        </p>
        <p>
          Each course has short lessons with real examples, the interview questions that actually come up (the important ones are
          marked), and a one-page cheat sheet for the night before. It&apos;s all free, and you don&apos;t need an account.
        </p>
        <p className="muted small">
          {s.courses} courses · {s.lessons} lessons · {s.questions} interview Q&amp;A · {s.scenarios} scenario questions ·{" "}
          {s.cheats} cheat-sheet sections
        </p>
      </section>
    </>
  );
}
