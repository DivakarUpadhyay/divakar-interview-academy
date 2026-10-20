import type { Metadata } from "next";
import Link from "next/link";
import { getCourses, getTracks } from "@/lib/db";

export const metadata: Metadata = { title: "Interview day plan" };

const PLAN: { when: string; items: string[] }[] = [
  {
    when: "One week before",
    items: [
      "Read the job description line by line; list every technology mentioned and map it to a course here.",
      "Do the High priority questions of each mapped course in the Practice panel until you score 80%+.",
      "Prepare 2 project walkthroughs and 5 STAR stories (conflict, failure, tight deadline, leadership, learning something fast).",
      "Research the company: product, customers, tech stack, recent news, Glassdoor/AmbitionBox interview reviews.",
      "Decide your salary range from market data (see Career gaps & salary course) — never go in without a number.",
    ],
  },
  {
    when: "The day before",
    items: [
      "Revise the cheat sheets of the 3–4 core courses for the role (e.g. C#, ASP.NET Core, SQL Server, Azure).",
      "Run one timed mock interview (10 questions, 2 minutes each, Scenario level included).",
      "Rehearse 'Tell me about yourself' out loud — 60 to 90 seconds.",
      "Online interview: test camera, mic, internet, screen sharing, IDE and the meeting link. Charge the laptop.",
      "Keep your resume, the job description and your pitch notes (Demo kit → My pitch) open in tabs.",
      "Sleep. Tired recall is worse than one more hour of revision.",
    ],
  },
  {
    when: "Interview morning / 1 hour before",
    items: [
      "Skim High priority cheat-sheet sections only — no new topics.",
      "Re-read your two project stories and the numbers in them.",
      "Have water, a pen and paper. Close notifications. Join 5 minutes early.",
    ],
  },
  {
    when: "During the interview",
    items: [
      "Technical answer shape: definition (1 line) → how it works → example/code → trade-off → where you used it.",
      "Don't know? Say what you do know, reason aloud, and say how you would find out. Never bluff.",
      "Coding round: clarify inputs and edge cases → brute force → optimise → code → test with an example → state complexity.",
      "Design/scenario round: requirements → estimates → high-level design → data model → bottlenecks → trade-offs.",
      "Behavioural: STAR, say 'I' not 'we', finish with a measurable result.",
      "Ask 2–3 thoughtful questions at the end.",
    ],
  },
  {
    when: "After",
    items: [
      "Write down every question you were asked the same day — they repeat across companies.",
      "Send a short thank-you note to the recruiter within 24 hours.",
      "Mark the questions you struggled with as bookmarks (☆) and revise them in the Interview panel.",
    ],
  },
];

export default function InterviewDay() {
  const tracks = getTracks();
  const courses = getCourses();
  return (
    <div className="narrow">
      <h1>Interview day plan</h1>
      <p className="muted">A step-by-step checklist from one week out to the thank-you mail, with direct links to the quick-revision material.</p>
      {PLAN.map((p) => (
        <div key={p.when} className="card" style={{ marginBottom: 12 }}>
          <h2 style={{ marginTop: 0 }}>{p.when}</h2>
          <ul className="checklist">{p.items.map((i) => <li key={i}>☐ {i}</li>)}</ul>
        </div>
      ))}
      <h2>Quick revision by track</h2>
      {tracks.map((t) => (
        <div key={t.slug} style={{ marginBottom: 10 }}>
          <b>{t.title}</b>
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            {courses.filter((c) => c.track_slug === t.slug).map((c) => (
              <Link key={c.slug} className="chip" href={`/courses/${c.slug}/cheatsheet`}>{c.title}</Link>
            ))}
          </div>
        </div>
      ))}
      <div className="row" style={{ marginTop: 20 }}>
        <Link className="btn primary" href="/practice">Start a mock interview</Link>
        <Link className="btn" href="/interview">High priority questions</Link>
        <Link className="btn" href="/demo">Demo kit &amp; pitch</Link>
      </div>
    </div>
  );
}
