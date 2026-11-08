import { getStats } from "@/lib/db";
import { json } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";

/** GET /api/stats.json: content totals. */
export function GET() {
  return json(getStats());
}
