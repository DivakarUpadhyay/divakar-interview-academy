// Schedules every unpublished dev.to draft for publication, one per day at 13:00 UTC (8 am New York, 2 pm Central
// Europe), starting the day after the latest post already scheduled. dev.to keeps scheduled posts hidden until then.
// Usage: node scripts/devto-schedule.mjs [--dry-run]
import fs from "node:fs";

const dryRun = process.argv.includes("--dry-run");
const env = fs.existsSync(".env.devto.local") ? fs.readFileSync(".env.devto.local", "utf8") : "";
const KEY = process.env.DEVTO_API_KEY ?? env.match(/^DEVTO_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("DEVTO_API_KEY missing — put it in .env.devto.local");
const headers = { "api-key": KEY, "content-type": "application/json", accept: "application/vnd.forem.api-v1+json", "user-agent": "devladder-schedule" };
const API = "https://dev.to/api";

const all = await (await fetch(`${API}/articles/me/all?per_page=1000`, { headers })).json();
const drafts = all.filter((a) => !a.published).sort((a, b) => a.id - b.id);
const latest = Math.max(Date.now(), ...all.filter((a) => a.published && a.published_at).map((a) => Date.parse(a.published_at)));

let day = new Date(latest);
day.setUTCHours(13, 0, 0, 0);
if (day.getTime() <= latest) day.setUTCDate(day.getUTCDate() + 1);

console.log(`${drafts.length} draft(s) to schedule${dryRun ? " (dry run)" : ""}`);
for (const d of drafts) {
  const at = day.toISOString();
  if (!dryRun) {
    const res = await fetch(`${API}/articles/${d.id}`, { method: "PUT", headers, body: JSON.stringify({ article: { published: true, published_at: at } }) });
    if (!res.ok) throw new Error(`#${d.id} → ${res.status} ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  console.log(`- ${at.slice(0, 16).replace("T", " ")} UTC  ${d.title}`);
  day.setUTCDate(day.getUTCDate() + 1);
}
