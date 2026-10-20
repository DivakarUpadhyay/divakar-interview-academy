import { getCourses } from "@/lib/db";
import { json } from "@/lib/api";

/** GET /api/courses — all courses in learning order with lesson/question counts. */
export function GET() {
  return json(getCourses());
}
