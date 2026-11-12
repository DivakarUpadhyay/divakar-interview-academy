import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page and JSON endpoint is generated at build time from data/academy.db, so the site is plain
  // static files (out/) that any free static host can serve, e.g. Cloudflare Pages.
  output: "export",
  // A fixed build ID keeps unchanged pages byte-identical between builds, so Cloudflare (which skips files it
  // already has) only uploads what really changed: tens of files instead of all ~6,000 on every deploy.
  generateBuildId: async () => "devladder",
};

export default nextConfig;
