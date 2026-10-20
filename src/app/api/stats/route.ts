import { getStats } from "@/lib/db";
import { json } from "@/lib/api";

/** GET /api/stats — content totals. */
export function GET() {
  return json(getStats());
}
