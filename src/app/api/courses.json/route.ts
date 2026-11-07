import { getCourses } from "@/lib/db";
import { json } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";

/** GET /api/courses.json — all courses in learning order with lesson/question counts. */
export function GET() {
  return json(getCourses());
}
