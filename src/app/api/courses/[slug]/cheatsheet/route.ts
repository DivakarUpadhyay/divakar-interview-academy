import { getCheats, getCourse } from "@/lib/db";
import { json, notFound } from "@/lib/api";

/** GET /api/courses/:slug/cheatsheet — quick-revision sections. */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]/cheatsheet">) {
  const { slug } = await ctx.params;
  const course = getCourse(slug);
  if (!course) return notFound("Course");
  return json({ course: { slug: course.slug, title: course.title }, sections: getCheats(course.id) });
}
