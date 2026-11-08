import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { PREP_PACK, prepPackHref } from "@/lib/earn";
import { getStats } from "@/lib/db";

export const metadata: Metadata = pageMeta({
  title: ".NET Interview Prep Pack (PDF)",
  description: "The most-asked .NET, C#, ASP.NET Core and SQL Server interview questions with short answers, one-page cheat sheets and a 30-day study plan, in one printable PDF.",
  path: "/interview-prep-pack",
});

export default function PrepPackPage() {
  const s = getStats();
  return (
    <div className="policy offer">
      <h1>.NET Interview Prep Pack</h1>
      <p className="tool-lead">
        Everything on DevLadder stays free to read online. The Prep Pack is for when you want it all in one place: printed, on
        your phone on the train, or open next to you during the week before an interview.
      </p>
      <div className="card offer-card">
        <h2>What&apos;s inside</h2>
        <ul>
          <li>The must-know questions from {s.courses} courses, with answers short enough to say out loud</li>
          <li>One-page cheat sheets for C#, ASP.NET Core, SQL Server, LINQ, EF Core and system design</li>
          <li>Scenario questions with the structure interviewers look for</li>
          <li>A 30-day study plan and an interview-day checklist</li>
        </ul>
        <p className="offer-price">{PREP_PACK.price} <span className="muted small">· PDF, free updates</span></p>
        <a className="btn primary" href={prepPackHref()}>{PREP_PACK.url ? "Get the Prep Pack" : "Notify me when it's ready"}</a>
      </div>
      <p className="muted small">
        Want to practise with a person instead? <Link href="/mentoring">Book a mock interview</Link>.
      </p>
    </div>
  );
}
