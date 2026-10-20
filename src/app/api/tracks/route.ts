import { getCourses, getTracks } from "@/lib/db";
import { json } from "@/lib/api";

/** GET /api/tracks — learning tracks in order, each with its courses. */
export function GET() {
  const courses = getCourses();
  return json(getTracks().map((t) => ({ ...t, courses: courses.filter((c) => c.track_slug === t.slug) })));
}
