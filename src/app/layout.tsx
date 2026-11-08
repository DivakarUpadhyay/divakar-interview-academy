import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import CopyHandler from "@/components/CopyHandler";
import { getCourses, getTracks } from "@/lib/db";
import { buildMenu } from "@/lib/menu";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/seo";
import { GtmHead, GtmNoScript } from "@/components/GoogleTagManager";
import { AdSenseScript } from "@/components/AdSense";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Step-by-Step Tutorials & Interview Questions`, template: `%s · ${SITE_NAME}` },
  description:
    "Free step-by-step tutorials from fundamentals to advanced: C#, .NET internals, ASP.NET Core MVC & Web API, Entity Framework, Dapper, SQL Server, system design, DSA, Azure, Angular, React, automation and Industry 4.0 — with interview questions and cheat sheets.",
  applicationName: SITE_NAME,
  keywords: [".NET interview questions", "C# tutorial", "ASP.NET Core MVC", "SQL Server internals", "system design", "low level design",
    "Entity Framework", "Dapper", "Web Forms", "VB.NET", "Azure", "full stack developer interview", "Industry 4.0", "test automation"],
  authors: [{ name: "Divakar Upadhyay" }],
  creator: "Divakar Upadhyay",
  category: "education",
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/feed.xml", title: "DevLadder lessons" }] } },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", url: "/" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  // Google Search Console ownership tag for https://devladder.pages.dev/ (account divakaru1991@gmail.com).
  // AdSense site ownership tag; only present in builds where the AdSense ID is set (Cloudflare).
  other: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? { "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_CLIENT } : undefined,
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "Cnjg00o39Txv8hsbJyQep3zou8SVyyDFUUPw_1xlpxM" },
};

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
  },
  { "@context": "https://schema.org", "@type": "EducationalOrganization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.svg` },
];

const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const menu = buildMenu(getTracks(), getCourses());
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(siteJsonLd)} />
        <AdSenseScript />
      </head>
      <body>
        <GtmNoScript />
        <header className="site-header">
          <SiteNav menu={menu} />
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container footer-cols">
            <div className="footer-about">
              <h4>DevLadder</h4>
              <p>Free, step-by-step lessons from fundamentals to advanced, with the interview questions companies actually ask.</p>
            </div>
            <div>
              <h4>Learn</h4>
              {menu.filter((t) => t.slug !== "interview").map((t) => (
                <Link key={t.slug} href={t.groups[0]?.links[0]?.href ?? "/courses"}>{t.label}</Link>
              ))}
            </div>
            <div>
              <h4>Practice</h4>
              <Link href="/interview-questions">Interview Questions by Role</Link>
              <Link href="/practice">Mock Interview Test</Link>
              <Link href="/cheatsheets">Cheat Sheets</Link>
              <Link href="/interview-day">Interview Day</Link>
              <Link href="/notebook">My Notebook</Link>
            </div>
            <div>
              <h4>More</h4>
              <Link href="/roadmap">Roadmap &amp; Syllabus</Link>
              <Link href="/courses">All Courses</Link>
              <Link href="/search">Search</Link>
              <Link href="/api-docs">REST API</Link>
            </div>
            <div>
              <h4>Site</h4>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Use</Link>
              <Link href="/disclosure">Disclosure</Link>
            </div>
          </div>
          <div className="container row footer-bottom">
            <span>© {new Date().getFullYear()} DevLadder · by Divakar Upadhyay</span>
            <span className="spacer" />
            <span>Learn in order · revise · practise</span>
          </div>
        </footer>
        <CopyHandler />
        <GtmHead />
        <Analytics />
      </body>
    </html>
  );
}
