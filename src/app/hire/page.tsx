import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { HIRE_HREF } from "@/lib/earn";
import { GITHUB_URL, OWNER } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Hire a .NET Developer",
  description: "Full-stack .NET developer available for freelance projects and full-time roles: ASP.NET Core APIs, SQL Server, Azure, React and Angular, with nine years of experience.",
  path: "/hire",
});

const SKILLS = [
  ["Back end", "C#, ASP.NET Core Web API and MVC, Entity Framework, Dapper, background services"],
  ["Data", "SQL Server design and performance tuning, SSIS and SSRS, reporting"],
  ["Cloud and DevOps", "Azure App Service, Azure SQL, Docker, CI/CD with Azure DevOps and GitHub Actions"],
  ["Front end", "React, Next.js and Angular dashboards and admin panels"],
];

export default function HirePage() {
  return (
    <div className="policy offer">
      <h1>Hire me</h1>
      <p className="tool-lead">
        I&apos;m {OWNER}, the developer behind DevLadder. I build and fix business systems with .NET and SQL Server, and I&apos;m
        open to freelance projects and full-time roles.
      </p>
      <div className="table-wrap"><table>
        <tbody>{SKILLS.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody>
      </table></div>
      <h2>Typical projects</h2>
      <ul>
        <li>A new ASP.NET Core API or admin portal, from database design to deployment</li>
        <li>Speeding up slow SQL Server queries and reports</li>
        <li>Moving an old .NET Framework or Web Forms app to modern .NET</li>
        <li>Maintenance and support for an existing .NET system</li>
      </ul>
      <p><a className="btn primary" href={HIRE_HREF}>Tell me about your project</a></p>
      <p className="muted small">
        See my code on <a href={GITHUB_URL} rel="noopener">GitHub</a>, or how I explain things in the <Link href="/courses">free courses</Link>.
      </p>
    </div>
  );
}
