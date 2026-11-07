import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { getCourses } from "@/lib/db";
import { OWNER } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "About DevLadder", description: "Who builds DevLadder, what it covers and how the free tutorials and interview questions are written and kept up to date.", path: "/about" });

export default function AboutPage() {
  const courses = getCourses();
  return (
    <div className="policy">
      <h1>About DevLadder</h1>
      <p>
        DevLadder is a free learning site with step-by-step tutorials, interview questions and cheat sheets for software developers.
        It currently has {courses.length} courses, from computer fundamentals and data structures to C#, .NET, SQL Server, cloud,
        DevOps, frontend frameworks, automation and Industry 4.0.
      </p>
      <h2>Who writes it</h2>
      <p>
        DevLadder is built and maintained by {OWNER}, a full-stack .NET developer with about nine years of experience building
        business systems with C#, ASP.NET, SQL Server and modern JavaScript frameworks. The lessons are written from that
        day-to-day work and from real interview experience.
      </p>
      <h2>How the content is made</h2>
      <ul>
        <li>Every course goes from basics to advanced, so you can learn in order without gaps.</li>
        <li>Interview questions are grouped by level and priority, with a short answer you can say out loud.</li>
        <li>Facts are checked against official documentation. If you spot a mistake, please <Link href="/contact">tell us</Link>.</li>
      </ul>
      <h2>How the site is funded</h2>
      <p>
        All lessons are free. To pay for hosting and keep it free, the site may show advertising and may link to books, courses or
        tools as an affiliate. See the <Link href="/disclosure">affiliate &amp; advertising disclosure</Link> for details.
      </p>
    </div>
  );
}
