import { getCourse, getSyllabus } from "@/lib/db";
import { json, notFound } from "@/lib/api";

/** GET /api/courses/:slug — course overview, versions, lifecycle, tools and the module/lesson syllabus. */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]">) {
  const { slug } = await ctx.params;
  const course = getCourse(slug);
  if (!course) return notFound("Course");
  return json({ ...course, modules: getSyllabus(course.id) });
}
