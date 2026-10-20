import { getCourse, getLesson } from "@/lib/db";
import { json, notFound } from "@/lib/api";

/** GET /api/courses/:slug/lessons/:lesson — one lesson (HTML body). */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]/lessons/[lesson]">) {
  const { slug, lesson } = await ctx.params;
  const course = getCourse(slug);
  const l = course && getLesson(course.id, lesson);
  if (!l) return notFound("Lesson");
  return json(l);
}
