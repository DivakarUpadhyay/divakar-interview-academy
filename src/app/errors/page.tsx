import type { Metadata } from "next";
import Link from "next/link";
import { jsonLd, pageMeta, SITE_URL } from "@/lib/seo";
import { ERRORS } from "@/lib/errors";

export const metadata: Metadata = pageMeta({
  title: "Fix Common .NET, SQL Server and Docker Errors",
  description: "Plain explanations and step-by-step fixes for the errors .NET developers hit most: SQL Server connection and login errors, deadlocks, EF Core, ASP.NET Core startup, CORS and Docker.",
  path: "/errors",
});

export default function ErrorsPage() {
  const areas = [...new Set(ERRORS.map((e) => e.area))];
  return (
    <div className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org", "@type": "ItemList", name: "Error fixes",
        itemListElement: ERRORS.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/errors/${e.slug}`, name: e.title })),
      })} />
      <h1>Fix common errors</h1>
      <p className="muted tool-lead">Got an error message? Find it below for what it means, why it happens and how to fix it, with code you can copy.</p>
      {areas.map((area) => (
        <section key={area}>
          <h2>{area}</h2>
          <div className="tool-grid">
            {ERRORS.filter((e) => e.area === area).map((e) => (
              <Link key={e.slug} href={`/errors/${e.slug}`} className="card"><b>{e.title}</b></Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
