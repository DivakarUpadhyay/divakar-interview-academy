import { getCourse, getCourses, getQuestionsForCourse } from "@/lib/db";
import { json, notFound } from "@/lib/api";

// Pre-built as a static file at deploy time.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getCourses().map((c) => ({ slug: c.slug }));

/** GET /api/courses/:slug/questions.json — every interview question of one course, in course order. */
export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[slug]/questions.json">) {
  const { slug } = await ctx.params;
  const course = getCourse(slug);
  if (!course) return notFound("Course");
  return json(getQuestionsForCourse(course.id));
}
