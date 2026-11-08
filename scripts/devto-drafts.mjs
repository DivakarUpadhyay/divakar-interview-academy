// Creates dev.to DRAFTS (never published) from DevLadder lessons, so a person can review and publish them by hand.
// Each draft = the full lesson + the course's top interview questions + a link back to the lesson, with
// canonical_url pointing at DevLadder so search engines treat the lesson page as the original.
//
// Usage: node scripts/devto-drafts.mjs [--count 7] [--dry-run] [--refresh]
// Needs DEVTO_API_KEY in .env.devto.local (gitignored). Lessons already on dev.to (draft or published) are skipped,
// detected by their canonical URL, so the script can run every week without duplicates.
import fs from "node:fs";
import path from "node:path";
import { parseCourse, slugify } from "./parse-course.mjs";

const args = process.argv.slice(2);
const count = Number(args[args.indexOf("--count") + 1]) || 7;
const dryRun = args.includes("--dry-run");
const SITE = "https://devladder.pages.dev";
const API = "https://dev.to/api";

const env = fs.existsSync(".env.devto.local") ? fs.readFileSync(".env.devto.local", "utf8") : "";
const KEY = process.env.DEVTO_API_KEY ?? env.match(/^DEVTO_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("DEVTO_API_KEY missing — put it in .env.devto.local");
const headers = { "api-key": KEY, "content-type": "application/json", accept: "application/vnd.forem.api-v1+json", "user-agent": "devladder-drafts" };

// dev.to allows 4 tags: lowercase letters and digits only.
const TRACK_TAGS = {
  dotnet: ["dotnet", "csharp"], data: ["sql", "database"], "devops-cloud": ["devops", "cloud"], frontend: ["javascript", "webdev"],
  foundations: ["programming", "computerscience"], automation: ["automation", "testing"], web3: ["web3", "blockchain"], interview: ["career", "interview"],
};
const tagsFor = (track, grade, course) => [...(course === "vbnet" ? ["dotnet", "vbnet"] : TRACK_TAGS[track] ?? ["programming"]), grade === "Basic" ? "beginners" : "tutorial", "interview"]
  .filter((t, i, a) => a.indexOf(t) === i).slice(0, 4);

// Every lesson with its URL and the course's High-priority questions.
function lessons() {
  const out = [];
  for (const f of fs.readdirSync("content/courses").filter((f) => f.endsWith(".md")).sort()) {
    const c = parseCourse(fs.readFileSync(path.join("content/courses", f), "utf8"), f);
    const top = c.questions.filter((q) => q.priority === "High");
    const all = c.modules.flatMap((m) => m.lessons);
    const used = new Set();
    const items = all.map((l, i) => {
      let slug = slugify(l.title);
      while (used.has(slug)) slug += "-2";
      used.add(slug);
      return { ...l, slug, index: i, total: all.length, course: c.meta, url: `${SITE}/courses/${c.meta.slug}/lessons/${slug}`, top };
    });
    items.forEach((l, i) => out.push({ ...l, next: items[i + 1] }));
  }
  return out;
}

// High-priority lessons first, taking one lesson per course in turn so the feed stays varied.
function pick(all, done, n) {
  const byCourse = new Map();
  for (const l of all.filter((l) => l.priority === "High" && !done.has(l.url))) {
    if (!byCourse.has(l.course.slug)) byCourse.set(l.course.slug, []);
    byCourse.get(l.course.slug).push(l);
  }
  // Tracks whose topics advertisers pay most for come first.
  const order = ["dotnet", "data", "devops-cloud", "frontend", "interview", "foundations", "automation", "web3"];
  const queues = [...byCourse.values()].sort((a, b) => order.indexOf(a[0].course.track) - order.indexOf(b[0].course.track));
  const picked = [];
  const topic = (t) => t.toLowerCase().split(/\s+[—-]\s+/)[0];
  const seen = new Set();
  for (let round = 0; picked.length < n && queues.some((q) => q.length > round); round++)
    for (const q of queues) {
      const l = q[round];
      if (!l || picked.length >= n || seen.has(topic(l.title))) continue;
      seen.add(topic(l.title));
      picked.push(l);
    }
  return picked;
}

function article(l) {
  const qs = l.top.slice(0, 3).map((q) => `### ${q.question}\n\n${q.answer.trim()}`).join("\n\n");
  const courseUrl = `${SITE}/courses/${l.course.slug}`;
  const next = l.next ? `\n\nNext in the course: [${l.next.title}](${l.next.url}) →` : "";
  const body = `*Lesson ${l.index + 1} of ${l.total} in the free [${l.course.title}](${courseUrl}) course on DevLadder.*

${l.body.trim()}

## Interview questions on ${l.course.title.split(" — ")[0]}

${qs}

---

Read the [full lesson with progress tracking](${l.url}) and the rest of the course on **DevLadder** — free step-by-step tutorials and interview questions for developers.${next}`;
  return {
    title: `${l.title} — ${l.course.title.split(" — ")[0]}`.slice(0, 128),
    body_markdown: body,
    published: false,
    canonical_url: l.url,
    tags: tagsFor(l.course.track, l.grade, l.course.slug),
    description: (l.course.summary ?? "").slice(0, 150),
  };
}

async function call(method, url, body) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 35000)); continue; }
    if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${await res.text()}`);
    return res.json();
  }
  throw new Error(`${method} ${url} → still rate limited`);
}

// Canonical URLs already on dev.to (drafts and published).
const done = new Set();
for (let page = 1; ; page++) {
  const items = await call("GET", `${API}/articles/me/all?per_page=1000&page=${page}`);
  items.forEach((a) => a.canonical_url && done.add(a.canonical_url.replace(/\/$/, "")));
  if (items.length < 1000) break;
}

// --refresh: rewrite the body of drafts this script already created (e.g. after a template change); never touches published posts.
if (args.includes("--refresh")) {
  const byUrl = new Map(lessons().map((l) => [l.url, l]));
  const drafts = await call("GET", `${API}/articles/me/unpublished?per_page=1000`);
  for (const d of drafts) {
    const l = byUrl.get((d.canonical_url ?? "").replace(/\/$/, ""));
    if (!l) continue;
    await call("PUT", `${API}/articles/${d.id}`, { article: { ...article(l), published: false } });
    console.log(`- refreshed draft #${d.id}: ${d.title}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  process.exit(0);
}

const picks = pick(lessons(), done, count);
console.log(`${done.size} lesson(s) already on dev.to; creating ${picks.length} draft(s)${dryRun ? " (dry run)" : ""}`);
for (const l of picks) {
  const a = article(l);
  if (dryRun) { console.log(`- ${a.title}  [${a.tags.join(", ")}]  ${a.canonical_url}`); continue; }
  const created = await call("POST", `${API}/articles`, { article: a });
  console.log(`- draft #${created.id}: ${a.title}`);
  await new Promise((r) => setTimeout(r, 4000));
}
if (!dryRun && picks.length) console.log("Review and publish them at https://dev.to/dashboard (one a day works best).");
