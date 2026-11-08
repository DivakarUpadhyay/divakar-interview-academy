import { getCheats, getCourse, getCourses } from "@/lib/db";
import { json, notFound } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getCourses().map((c) => ({ slug: c.slug }));

/** GET /api/courses/:slug/cheatsheet.json, quick-revision sections. */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]/cheatsheet.json">) {
  const { slug } = await ctx.params;
  const course = getCourse(slug);
  if (!course) return notFound("Course");
  return json({ course: { slug: course.slug, title: course.title }, sections: getCheats(course.id) });
}
