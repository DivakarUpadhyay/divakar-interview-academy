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
  title: { default: `${SITE_NAME}: Step-by-Step Tutorials & Interview Questions`, template: `%s · ${SITE_NAME}` },
  description:
    "Free step-by-step tutorials from fundamentals to advanced: C#, .NET internals, ASP.NET Core MVC & Web API, Entity Framework, Dapper, SQL Server, system design, DSA, Azure, Angular, React, automation and Industry 4.0, with interview questions and cheat sheets.",
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
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "Cnjg00o39Txv8hsbJyQep3zou8SVyyDFUUPw_1xlpxM",
    // Bing Webmaster Tools ownership tag.
    other: { "msvalidate.01": "046FB5950345A7F004B012A5C60851ED" } },
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
        {/* impact.com site verification (Coursera / Udemy affiliate programs) */}
        <meta name="impact-site-verification" {...{ value: "3f7b0607-152a-45d8-9094-7f8e688c9222" }} />
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
              <Link href="/" className="footer-brand"><span className="brand-mark">DL</span>DevLadder</Link>
              <p>Free tutorials that take you from the basics to advanced topics one step at a time, with the interview questions
                companies really ask. No sign-up, no paywall on the lessons.</p>
              <Link href="/courses" className="footer-cta">Browse all courses →</Link>
            </div>
            <nav aria-label="Learn">
              <h4>Learn</h4>
              {menu.filter((t) => t.slug !== "interview").map((t) => (
                <Link key={t.slug} href={t.groups[0]?.links[0]?.href ?? "/courses"}>{t.label}</Link>
              ))}
              <Link href="/roadmap">Roadmap and syllabus</Link>
            </nav>
            <nav aria-label="Practice">
              <h4>Practice</h4>
              <Link href="/interview-questions">Interview questions by role</Link>
              <Link href="/practice">10-minute mock test</Link>
              <Link href="/cheatsheets">Cheat sheets</Link>
              <Link href="/interview-day">Interview day checklist</Link>
              <Link href="/notebook">My notebook</Link>
            </nav>
            <nav aria-label="Tools">
              <h4>Tools and fixes</h4>
              <Link href="/tools">Free developer tools</Link>
              <Link href="/errors">Common error fixes</Link>
              <Link href="/search">Search the site</Link>
              <Link href="/api-docs">REST API</Link>
            </nav>
            <nav aria-label="Work with me">
              <h4>Get help</h4>
              <Link href="/mentoring">Mock interviews and CV review</Link>
              <Link href="/interview-prep-pack">Interview Prep Pack</Link>
              <Link href="/hire">Hire me for a project</Link>
              <Link href="/advertise">Advertise or sponsor</Link>
            </nav>
          </div>
          <div className="container footer-bottom">
            <span>© {new Date().getFullYear()} DevLadder, made by Divakar Upadhyay in Taipei</span>
            <span className="footer-legal">
              <Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link><Link href="/disclosure">Disclosure</Link>
            </span>
          </div>
        </footer>
        <CopyHandler />
        <GtmHead />
        <Analytics />
      </body>
    </html>
  );
}
