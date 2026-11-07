import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page and JSON endpoint is generated at build time from data/academy.db, so the site is plain
  // static files (out/) that any free static host can serve, e.g. Cloudflare Pages.
  output: "export",
};

export default nextConfig;
