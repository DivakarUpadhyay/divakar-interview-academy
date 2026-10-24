import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { getCourses, getQuestionsForCourses } from "@/lib/db";
import { ROLES } from "@/lib/roles";

export const metadata: Metadata = pageMeta({ title: "Interview Questions by Role", description: "Interview question banks for .NET full stack, backend, legacy .NET, frontend, SQL/BI, DevOps, test automation, industrial automation, Industry 4.0, Web3 and team lead roles — must-know questions first.", path: "/interview-questions" });

export default function InterviewQuestionsIndex() {
  const known = new Set(getCourses().map((c) => c.slug));
  return (
    <>
      <h1>Interview Questions by Role</h1>
      <p className="muted">
        Pick the job you are interviewing for. Each bank collects the questions from every topic that role is tested on, in study
        order, with the <span className="badge High">★ Must know</span> questions first.
      </p>
      <p><Link className="btn primary" href="/interview-questions/all">See all questions topic-wise →</Link></p>
      <div className="tiles">
        {ROLES.map((r) => {
          const qs = getQuestionsForCourses(r.courses.filter((s) => known.has(s)));
          return (
            <Link key={r.slug} href={`/interview-questions/${r.slug}`} className="tile">
              <span className="tile-icon" style={{ background: r.color }}>{r.icon}</span>
              <span className="tile-name">{r.title}</span>
              <span className="muted small">{qs.filter((q) => q.priority === "High").length} must-know · {qs.length} total</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
