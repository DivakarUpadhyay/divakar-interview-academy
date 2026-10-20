import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The SQLite file is read at runtime by the REST API routes; make sure it ships with them.
  outputFileTracingIncludes: { "/api/**": ["./data/academy.db"] },
};

export default nextConfig;
