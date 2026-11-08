import { getAllLessonParams, getCourse, getLesson } from "@/lib/db";
import { json, notFound } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = getAllLessonParams;

/** GET /api/courses/:slug/lessons/:lesson/lesson.json, one lesson (HTML body). */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]/lessons/[lesson]/lesson.json">) {
  const { slug, lesson } = await ctx.params;
  const course = getCourse(slug);
  const l = course && getLesson(course.id, lesson);
  if (!l) return notFound("Lesson");
  return json(l);
}
