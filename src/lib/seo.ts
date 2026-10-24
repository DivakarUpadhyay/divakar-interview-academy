import type { Metadata } from "next";

// Public site address used for canonical URLs, the sitemap and structured data.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://divakar-interview-academy.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "DevLadder";
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "DevLadder — tutorials from basics to advanced" };

/** Plain-text summary for meta descriptions: strips HTML, collapses whitespace, cuts at a word boundary. */
export function describe(text: string, max = 158) {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—-]+$/, "") + "…";
}

/** Page metadata with canonical URL, Open Graph and Twitter fields filled consistently. */
export function pageMeta({ title, description, path, noindex = false, type = "website" }: {
  title: string; description: string; path: string; noindex?: boolean; type?: "website" | "article";
}): Metadata {
  const desc = describe(description);
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title, description: desc, url: path, siteName: SITE_NAME, type, locale: "en_IN", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description: desc, images: [OG_IMAGE.url] },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

/** Serialises JSON-LD safely for a <script> tag (escapes '<' so content can't close the tag). */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: SITE_URL + it.path })),
});
