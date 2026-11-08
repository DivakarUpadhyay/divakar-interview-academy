import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getStats } from "@/lib/db";
import RequestForm from "@/components/RequestForm";

export const metadata: Metadata = pageMeta({
  title: "Advertise and Sponsor DevLadder",
  description: "Reach developers who are learning .NET, SQL Server, cloud and front-end skills and preparing for interviews. Sponsored lessons, tool pages and course placements.",
  path: "/advertise",
});

export default function AdvertisePage() {
  const s = getStats();
  return (
    <div className="policy offer">
      <h1>Advertise on DevLadder</h1>
      <p className="tool-lead">
        DevLadder readers are developers learning a new skill or getting ready for an interview, which is exactly when they
        choose new tools, courses and services.
      </p>
      <h2>What we have</h2>
      <ul>
        <li>{s.courses} free courses and {s.lessons} lessons on .NET, SQL Server, cloud, DevOps and front-end development</li>
        <li>{s.questions} interview questions with answers, read by people about to change jobs</li>
        <li>Free developer tools (JSON, SQL, regex, JWT) that people come back to every day</li>
      </ul>
      <h2>Ways to work together</h2>
      <ul>
        <li><b>Sponsored placement</b> on a course or tool page relevant to your product</li>
        <li><b>Sponsored lesson</b>: a practical tutorial that uses your product, clearly marked as sponsored</li>
        <li><b>Course or tool listing</b> in the Recommended resources boxes</li>
      </ul>
      <p>Every sponsored item is labelled, and we only feature products that are genuinely useful to developers.</p>
      <RequestForm topics={["Sponsorship"]} cta="Send enquiry" messageLabel="Your product, budget and the placement you are interested in" />
    </div>
  );
}
