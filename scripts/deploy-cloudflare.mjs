// One command to publish DevLadder: build the static site, upload it to Cloudflare Pages, then notify search engines.
// Needs `npx wrangler login` once, and .env.production.local with the AdSense ids (not committed).
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit", env: { ...process.env, CI: "1" } });
run("npm run build");
run("npx --yes wrangler@4.151.2 pages deploy out --project-name devladder --branch main --commit-dirty=true");
run("node scripts/indexnow.mjs");
