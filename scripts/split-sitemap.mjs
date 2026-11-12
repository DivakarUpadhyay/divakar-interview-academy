// After `next build`: split out/sitemap.xml into smaller section sitemaps, a sitemap index and a plain-text list.
// Search Console handles a small index plus section files more reliably than one large file on a new property.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const xml = readFileSync("out/sitemap.xml", "utf8");
const entries = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
const locOf = (e) => e.match(/<loc>(.*?)<\/loc>/)[1];
const site = new URL(locOf(entries[0])).origin;

const sections = { pages: [], courses: [], lessons: [] };
for (const e of entries) {
  const path = new URL(locOf(e)).pathname;
  if (path.includes("/lessons/")) sections.lessons.push(e);
  else if (path.startsWith("/courses/")) sections.courses.push(e);
  else sections.pages.push(e);
}

const now = new Date().toISOString();
mkdirSync("out/sitemaps", { recursive: true });
const head = '<?xml version="1.0" encoding="UTF-8"?>\n';
for (const [name, list] of Object.entries(sections)) {
  writeFileSync(`out/sitemaps/${name}.xml`,
    `${head}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.join("\n")}\n</urlset>\n`);
}
writeFileSync("out/sitemap-index.xml",
  `${head}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  Object.keys(sections).map((n) => `<sitemap><loc>${site}/sitemaps/${n}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join("\n") +
  "\n</sitemapindex>\n");
writeFileSync("out/sitemap.txt", entries.map(locOf).join("\n") + "\n");

console.log(`sitemaps: ${Object.entries(sections).map(([n, l]) => `${n}=${l.length}`).join(", ")}, total ${entries.length}`);
