// Puts every DevLadder post on dev.to into its topic series (by the course track of its canonical lesson URL), so
// readers see "Part N of M" with links to the other posts. Safe to re-run: posts already in the right series are skipped.
// Usage: node scripts/devto-series.mjs [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { parseCourse } from "./parse-course.mjs";

// Keep in sync with SERIES in devto-drafts.mjs.
const SERIES = {
  dotnet: "DevLadder: C# & .NET from Scratch", data: "DevLadder: SQL Server & Data", "devops-cloud": "DevLadder: Cloud & DevOps",
  frontend: "DevLadder: Frontend Essentials", foundations: "DevLadder: CS Fundamentals for Interviews", interview: "DevLadder: Interview Prep",
  automation: "DevLadder: Automation & Industry 4.0", web3: "DevLadder: Web3 Basics",
};

const dryRun = process.argv.includes("--dry-run");
const env = fs.existsSync(".env.devto.local") ? fs.readFileSync(".env.devto.local", "utf8") : "";
const KEY = process.env.DEVTO_API_KEY ?? env.match(/^DEVTO_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("DEVTO_API_KEY missing — put it in .env.devto.local");
const headers = { "api-key": KEY, "content-type": "application/json", accept: "application/vnd.forem.api-v1+json", "user-agent": "devladder-series" };

const trackOf = new Map(fs.readdirSync("content/courses").filter((f) => f.endsWith(".md"))
  .map((f) => parseCourse(fs.readFileSync(path.join("content/courses", f), "utf8"), f).meta).map((m) => [m.slug, m.track]));

const posts = await (await fetch("https://dev.to/api/articles/me/all?per_page=1000", { headers })).json();
for (const a of posts) {
  const slug = a.canonical_url?.match(/\/courses\/([^/]+)\//)?.[1];
  const series = SERIES[trackOf.get(slug)];
  if (!series) { console.log(`- skip (not a DevLadder lesson): ${a.title}`); continue; }
  if (!dryRun) {
    const res = await fetch(`https://dev.to/api/articles/${a.id}`, { method: "PUT", headers, body: JSON.stringify({ article: { series } }) });
    if (!res.ok) throw new Error(`#${a.id} → ${res.status} ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  console.log(`- ${series}  ←  ${a.title}`);
}
