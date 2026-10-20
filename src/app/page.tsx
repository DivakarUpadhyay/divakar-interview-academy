import Link from "next/link";
import { getCourses, getStats, getTracks } from "@/lib/db";
import CourseCard from "@/components/CourseCard";
import { Legend } from "@/components/Badges";

export default function Home() {
  const tracks = getTracks();
  const courses = getCourses();
  const s = getStats();
  return (
    <>
      <section className="hero">
        <h1>Learn it in order. Answer it with confidence.</h1>
        <p>
          A step-by-step path from C# basics to cloud, data, frontend and Web3, with interview questions graded Beginner to
          Advanced and scenario-based, each tagged High, Medium or Low priority. Every course has its versions, lifecycle and
          tools, plus a one-page cheat sheet for the morning of the interview.
        </p>
        <div className="row">
          <Link className="btn primary" href="/roadmap">Start the roadmap</Link>
          <Link className="btn" href="/interview">Open the interview panel</Link>
          <Link className="btn" href="/practice">Take a mock interview</Link>
          <Link className="btn" href="/cheatsheets">Quick revision</Link>
        </div>
      </section>
      <div className="stats">
        <div className="stat"><b>{s.tracks}</b><span>tracks</span></div>
        <div className="stat"><b>{s.courses}</b><span>courses</span></div>
        <div className="stat"><b>{s.lessons}</b><span>lessons</span></div>
        <div className="stat"><b>{s.questions}</b><span>interview Q&amp;A</span></div>
        <div className="stat"><b>{s.scenarios}</b><span>scenario questions</span></div>
        <div className="stat"><b>{s.cheats}</b><span>cheat-sheet sections</span></div>
      </div>
      <Legend />
      {tracks.map((t) => (
        <section key={t.slug} className="track">
          <h2>{t.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{t.summary}</p>
          <div className="grid">
            {courses.filter((c) => c.track_slug === t.slug).map((c) => <CourseCard key={c.slug} c={c} />)}
          </div>
        </section>
      ))}
    </>
  );
}
