// One command to publish DevLadder: build the static site, upload it to Cloudflare Pages, notify search engines,
// then measure page speed.
// Needs `npx wrangler login` once, and .env.production.local with the AdSense ids (not committed).
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit", env: { ...process.env, CI: "1" } });
run("npm run build");
run("npx --yes wrangler@4.151.2 pages deploy out --project-name devladder --branch main --commit-dirty=true");
run("node scripts/indexnow.mjs");
// Report page speed after every deploy (does not undo the deploy; the daily GitHub check opens an issue if bad).
// Give Cloudflare's edge a moment to serve the new deployment; the very first loads after a deploy are cache misses.
await new Promise((r) => setTimeout(r, 45000));
try { run("python scripts/vitals_check.py"); } catch { console.log("Page speed: some pages are outside Google's good range, see above."); }
