import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbs, jsonLd, pageMeta, SITE_URL } from "@/lib/seo";
import { ERRORS, errorBySlug } from "@/lib/errors";
import Resources from "@/components/Resources";

export const dynamicParams = false;
export const generateStaticParams = () => ERRORS.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: PageProps<"/errors/[slug]">): Promise<Metadata> {
  const e = errorBySlug((await params).slug);
  if (!e) return { title: "Error" };
  return pageMeta({ title: `Fix: ${e.title}`, description: `${e.meaning} Causes and step-by-step fixes with code.`, path: `/errors/${e.slug}`, type: "article" });
}

/** Renders `code` spans in plain text. */
function Text({ s }: { s: string }) {
  return <>{s.split(/(`[^`]+`)/).map((part, i) => part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part)}</>;
}

const TRACK: Record<string, string> = { "SQL Server": "data", Docker: "devops-cloud" };

export default async function ErrorFixPage({ params }: PageProps<"/errors/[slug]">) {
  const e = errorBySlug((await params).slug);
  if (!e) notFound();
  const path = `/errors/${e.slug}`;
  const related = ERRORS.filter((x) => x.area === e.area && x.slug !== e.slug).slice(0, 4);
  return (
    <div className="policy error-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([
        { "@context": "https://schema.org", "@type": "TechArticle", headline: `Fix: ${e.title}`, url: SITE_URL + path, description: e.meaning,
          author: { "@type": "Person", name: "Divakar Upadhyay" } },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
          { "@type": "Question", name: `What does "${e.title}" mean?`, acceptedAnswer: { "@type": "Answer", text: e.meaning } },
          { "@type": "Question", name: `How do I fix "${e.title}"?`, acceptedAnswer: { "@type": "Answer", text: e.fixes.join(" ").replace(/`/g, "") } },
        ] },
        breadcrumbs([{ name: "Error fixes", path: "/errors" }, { name: e.title, path }]),
      ])} />
      <div className="crumbs"><Link href="/errors">Error fixes</Link> › {e.area}</div>
      <h1>{e.title}</h1>
      <pre className="error-message"><code>{e.message}</code></pre>
      <h2>What it means</h2>
      <p>{e.meaning}</p>
      <h2>Common causes</h2>
      <ul>{e.causes.map((c) => <li key={c}><Text s={c} /></li>)}</ul>
      <h2>How to fix it</h2>
      <ol>{e.fixes.map((f) => <li key={f}><Text s={f} /></li>)}</ol>
      {e.snippet && <pre className="error-snippet"><code>{e.snippet.code}</code></pre>}
      {e.lesson && <p>Learn the background step by step: <Link href={e.lesson.href}>{e.lesson.title}</Link>.</p>}
      {related.length > 0 && (<>
        <h2>Related errors</h2>
        <ul>{related.map((r) => <li key={r.slug}><Link href={`/errors/${r.slug}`}>{r.title}</Link></li>)}</ul>
      </>)}
      <Resources track={TRACK[e.area] ?? "dotnet"} title="Go further" />
    </div>
  );
}
