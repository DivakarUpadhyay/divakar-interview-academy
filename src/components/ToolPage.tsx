import Link from "next/link";
import { breadcrumbs, jsonLd, SITE_URL } from "@/lib/seo";
import { TOOLS, type Tool } from "@/lib/tools";
import Resources from "@/components/Resources";

/** Shared layout for a tool page: title, the tool itself, a how-to guide, FAQ (with FAQPage data) and related tools. */
export default function ToolPage({ tool, children, howTo, faq }: {
  tool: Tool; children: React.ReactNode; howTo: React.ReactNode; faq: [string, string][];
}) {
  const path = `/tools/${tool.slug}`;
  return (
    <div className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([
        { "@context": "https://schema.org", "@type": "WebApplication", name: tool.name, url: SITE_URL + path, description: tool.description,
          applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        { "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
        breadcrumbs([{ name: "Tools", path: "/tools" }, { name: tool.name, path }]),
      ])} />
      <div className="crumbs"><Link href="/tools">Free developer tools</Link> › {tool.name}</div>
      <h1>{tool.name}</h1>
      <p className="muted tool-lead">{tool.description}</p>
      <section className="card tool-box">{children}</section>
      <section className="prose tool-guide">
        <h2>How to use it</h2>
        {howTo}
        <h2>Frequently asked questions</h2>
        {faq.map(([q, a]) => (
          <details key={q} className="panel"><summary>{q}</summary><p>{a}</p></details>
        ))}
      </section>
      <Resources track={tool.slug === "sql-formatter" ? "data" : "dotnet"} />
      <section className="tool-related">
        <h2>More free tools</h2>
        <div className="tool-grid">
          {TOOLS.filter((t) => t.slug !== tool.slug).map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="card"><b>{t.name}</b><br /><span className="muted small">{t.short}</span></Link>
          ))}
        </div>
      </section>
    </div>
  );
}
