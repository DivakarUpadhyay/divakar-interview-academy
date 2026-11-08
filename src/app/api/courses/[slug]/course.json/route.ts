import { getCourse, getCourses, getSyllabus } from "@/lib/db";
import { json, notFound } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getCourses().map((c) => ({ slug: c.slug }));

/** GET /api/courses/:slug/course.json, course overview, versions, lifecycle, tools and the module/lesson syllabus. */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]/course.json">) {
  const { slug } = await ctx.params;
  const course = getCourse(slug);
  if (!course) return notFound("Course");
  return json({ ...course, modules: getSyllabus(course.id) });
}
