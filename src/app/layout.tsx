import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import CopyHandler from "@/components/CopyHandler";

export const metadata: Metadata = {
  title: { default: "Divakar Interview Academy", template: "%s · Divakar Interview Academy" },
  description:
    ".NET, C#, OOP, SOLID, design patterns, LINQ, EF Core, ADO.NET, ASP.NET Core MVC & Web API, SQL Server T-SQL, ETL, SSIS, SSRS, Docker, Kubernetes, Azure, Azure DevOps, JavaScript, jQuery, AngularJS, Angular, React, Vue, Web3 — lessons, interview Q&A, scenarios and cheat sheets.",
};

const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="site-header">
          <div className="container bar">
            <Link href="/" className="brand">
              <span className="brand-mark">DI</span> Divakar Interview Academy
            </Link>
            <SiteNav />
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container row">
            <span>Divakar Interview Academy — learn in order, revise with cheat sheets, practise with mock interviews.</span>
            <span className="spacer" />
            <Link href="/api-docs">REST API</Link>
          </div>
        </footer>
        <CopyHandler />
      </body>
    </html>
  );
}
