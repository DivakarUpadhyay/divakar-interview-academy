import type { Metadata } from "next";
import Link from "next/link";
import { jsonLd, pageMeta, SITE_URL } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = pageMeta({
  title: "Free Developer Tools — JSON, SQL, Regex, GUID, Base64, JWT",
  description: "Free online developer tools that run in your browser: JSON formatter, SQL formatter, regex tester, GUID generator, Base64 encoder and JWT decoder. Nothing is uploaded.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <div className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org", "@type": "ItemList", name: "Free developer tools",
        itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/tools/${t.slug}`, name: t.name })),
      })} />
      <h1>Free developer tools</h1>
      <p className="muted tool-lead">Everyday tools for .NET, SQL Server and web developers. Everything runs in your browser — your data is never uploaded.</p>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <Link key={t.slug} href={`/tools/${t.slug}`} className="card">
            <b>{t.name}</b><br /><span className="muted small">{t.short}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
