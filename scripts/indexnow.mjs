// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver…; Bing also feeds DuckDuckGo) which pages are new or
// changed since the last run. Compares a hash of every exported page in out/ with .indexnow-state.json.
// Usage: node scripts/indexnow.mjs [--all]   (run after `npm run build`, once the deploy is live)
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const statePath = path.resolve(".indexnow-state.json");
const seo = fs.readFileSync("src/lib/seo.ts", "utf8");
const key = seo.match(/INDEXNOW_KEY = "([0-9a-f]+)"/)[1];
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? seo.match(/NEXT_PUBLIC_SITE_URL \?\? "([^"]+)"/)[1]).replace(/\/$/, "");
const host = new URL(site).host;
const SKIP = new Set(["404.html", "_not-found.html"]);

if (!fs.existsSync(root)) throw new Error("out/ not found — run `npm run build` first");

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    // Skip the private owner dashboard, which must never be submitted to search engines.
    if (e.name === "owner" || e.name === "owner.html") continue;
    if (e.isDirectory()) { if (e.name !== "_next") pages(f, acc); }
    else if (e.name.endsWith(".html") && !SKIP.has(e.name)) acc.push(f);
  }
  return acc;
}

// Hash only the page text that matters (drop build ids and script chunks so a rebuild alone doesn't look like a change).
const hash = (html) => crypto.createHash("sha1").update(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/\/_next\/[^"']+/g, "")).digest("hex");
const toUrl = (f) => {
  const rel = path.relative(root, f).split(path.sep).join("/").replace(/\.html$/, "");
  return site + (rel === "index" ? "/" : "/" + rel);
};

const old = !process.argv.includes("--all") && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : {};
const now = {};
const changed = [];
for (const f of pages(root)) {
  const url = toUrl(f);
  now[url] = hash(fs.readFileSync(f, "utf8"));
  if (old[url] !== now[url]) changed.push(url);
}

if (!changed.length) { console.log("IndexNow: no new or changed pages."); process.exit(0); }

// Make sure the key file is reachable before submitting, otherwise engines reject the batch.
const keyRes = await fetch(`${site}/${key}.txt`);
if (!keyRes.ok || (await keyRes.text()).trim() !== key) throw new Error(`Key file ${site}/${key}.txt is not live yet — deploy first`);

for (let i = 0; i < changed.length; i += 10000) {
  const urlList = changed.slice(i, i + 10000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList }),
  });
  console.log(`IndexNow: submitted ${urlList.length} URL(s) → HTTP ${res.status}`);
  if (res.status >= 300) { console.log(await res.text()); process.exit(1); }
}
fs.writeFileSync(statePath, JSON.stringify(now));
