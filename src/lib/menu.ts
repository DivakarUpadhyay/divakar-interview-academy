import type { CourseSummary, Track } from "@/lib/db";
import { ROLES } from "@/lib/roles";

// Short labels for menus and home tiles (tutorialsteacher style: "C#", "LINQ", "SQL Server").
const SHORT: Record<string, string> = {
  nodejs: "Node.js", nextjs: "Next.js", iis: "IIS & Hosting .NET Apps", "azure-databases": "Azure Databases (SQL, Cosmos DB)",
  aws: "Amazon Web Services (AWS)", gcp: "Google Cloud (GCP)",
  "computer-fundamentals": "How Computers & Memory Work", dsa: "Data Structures & Algorithms", "system-design": "System Design (HLD)",
  lld: "Low-Level Design (LLD)",
  "dotnet-internals": ".NET Internals: CLR, Memory & GC", vbnet: "VB.NET", "aspnet-webforms": "ASP.NET Web Forms", "aspnet-mvc5": "ASP.NET MVC 5",
  "exception-handling": "Exception Handling & Custom Errors", logging: "Logging & Custom Logging", "custom-controls": "Custom Controls & Components",
  "project-architecture": "Project Architecture & Folders", "sqlserver-internals": "SQL Server Internals", "networking-hosting": "Networking & Hosting: How the Web Works",
  csharp: "C#", oop: "OOP", solid: "SOLID Principles", "design-patterns": "Design Patterns", "clean-code": "Clean Code & Unit Testing",
  "coding-practice": "Coding Round (DSA)", "dotnet-platform": "Modern .NET: Host, Config, DI", "aspnet-core-mvc": "ASP.NET Core MVC",
  "aspnet-core-webapi": "ASP.NET Core Web API", linq: "LINQ", adonet: "ADO.NET", efcore: "Entity Framework (EF6 & Core)", dapper: "Dapper",
  microservices: "Microservices & System Design", sqlserver: "SQL Server & T-SQL", etl: "ETL & Data Warehouse", ssis: "SSIS", ssrs: "SSRS",
  git: "Git & GitHub", docker: "Docker", kubernetes: "Kubernetes", "azure-devops": "Azure DevOps CI/CD", azure: "Microsoft Azure",
  "html-css": "HTML & CSS", javascript: "JavaScript", typescript: "TypeScript", jquery: "jQuery", angularjs: "AngularJS (legacy)",
  angular: "Angular", react: "React", vue: "Vue.js", "test-automation": "Test Automation", "industrial-automation": "Industrial Automation (PLC/SCADA)",
  "industry-40": "Industry 4.0 & IIoT", "blockchain-web3": "Blockchain & Web3", solidity: "Solidity",
  "dotnet-fullstack-interview": ".NET Full Stack Interview", "hr-behavioral": "HR & Behavioural", leadership: "Team Lead & Agile",
  "career-gaps-salary": "Career Gaps & Salary", "company-wise": "Company-wise Prep",
};

export function shortTitle(c: Pick<CourseSummary, "slug" | "title">) {
  return SHORT[c.slug] ?? c.title.split(/ — | \(/)[0];
}

export type MenuLink = { href: string; title: string; icon: string; color: string; slug?: string; lessons?: number };
export type MenuGroup = { title: string; links: MenuLink[] };
export type MenuTrack = { slug: string; label: string; title: string; groups: MenuGroup[] };

export function buildMenu(tracks: Track[], courses: CourseSummary[]): MenuTrack[] {
  return tracks.map((t) => {
    const groups: MenuGroup[] = [];
    for (const c of courses.filter((c) => c.track_slug === t.slug)) {
      const name = c.grp || t.menu;
      let g = groups.find((x) => x.title === name);
      if (!g) groups.push((g = { title: name, links: [] }));
      g.links.push({ href: `/courses/${c.slug}`, title: shortTitle(c), icon: c.icon, color: c.color, slug: c.slug, lessons: c.lessons });
    }
    if (t.slug === "interview") {
      groups.unshift({
        title: "Question Banks by Role",
        links: [
          { href: "/interview-questions/all", title: "All Questions — Topic-wise", icon: "All", color: "#c92a2a" },
          ...ROLES.map((r) => ({ href: `/interview-questions/${r.slug}`, title: r.title, icon: r.icon, color: r.color })),
        ],
      });
    }
    return { slug: t.slug, label: t.menu, title: t.title.replace(/^\d+\.\s*/, ""), groups };
  });
}
