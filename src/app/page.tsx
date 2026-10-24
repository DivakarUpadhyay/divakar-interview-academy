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
          <p>Short lessons with real examples, from basics to advanced — then the questions interviewers actually ask, with the must-know ones marked.</p>
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
      <h2 className="home-title">Learn Programming</h2>
      <p className="home-sub">Each subject runs from basics to advanced — study the topics left to right. The bar under a tile shows your progress.</p>
      {menu.map((t) => (
        <section key={t.slug} className="tile-section">
          <h2>{t.title}</h2>
          {t.groups.map((g, i) => (
            <div key={g.title}>
              {t.groups.length > 1 && <div className="tile-group">{i + 1}. {g.title}</div>}
              <div className="tiles">
                {g.links.map((l) => (
                  <Link key={l.href} href={l.href} className="tile">
                    <span className="tile-icon" style={{ background: l.color }}>{l.icon}</span>
                    <span className="tile-name">{l.title}</span>
                    {l.slug && <TileProgress slug={l.slug} total={l.lessons ?? 0} />}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

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
        <h2>DEVLADDER</h2>
        <p>
          DevLadder is a free, step-by-step learning path: computer fundamentals, DSA and system design; the whole .NET
          ecosystem from C# and VB.NET internals to ASP.NET Core; SQL Server and its internals; IIS, Azure, AWS and Google Cloud; Node.js,
          Next.js, Angular, React and Vue; automation and Industry 4.0. Every course has lessons with examples, interview questions with
          short bullet-point answers (must-know ones marked), and a one-page cheat sheet.
        </p>
        <p className="muted small">
          {s.courses} courses · {s.lessons} lessons · {s.questions} interview Q&amp;A · {s.scenarios} scenario questions ·{" "}
          {s.cheats} cheat-sheet sections
        </p>
      </section>
    </>
  );
}
