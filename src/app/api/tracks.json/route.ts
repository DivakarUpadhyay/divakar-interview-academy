import { getCourses, getTracks } from "@/lib/db";
import { json } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";

/** GET /api/tracks.json — learning tracks in order, each with its courses. */
export function GET() {
  const courses = getCourses();
  return json(getTracks().map((t) => ({ ...t, courses: courses.filter((c) => c.track_slug === t.slug) })));
}
