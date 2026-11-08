import { getFeedItems } from "@/lib/db";
import { describe, SITE_NAME, SITE_URL } from "@/lib/seo";

// RSS 2.0 feed of every lesson, so feed readers, aggregators and search engines pick up the content.
export const dynamic = "force-static";

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getFeedItems().map((it) => {
    const link = `${SITE_URL}/courses/${it.course_slug}/lessons/${it.slug}`;
    return `<item><title>${xml(`${it.title}: ${it.course_title}`)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid>` +
      `<category>${xml(it.course_title)}</category><description>${xml(describe(it.body_html, 300))}</description></item>`;
  }).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${SITE_NAME}: tutorials and interview questions</title><link>${SITE_URL}</link>
<description>Free step-by-step lessons from fundamentals to advanced, with interview questions.</description><language>en</language>
<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
