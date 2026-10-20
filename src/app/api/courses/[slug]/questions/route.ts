import { NextRequest } from "next/server";
import { findQuestions, getCourse } from "@/lib/db";
import { filterFromSearchParams, json, notFound } from "@/lib/api";

/** GET /api/courses/:slug/questions?level=&priority=&q= — interview questions of one course. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/courses/[slug]/questions">) {
  const { slug } = await ctx.params;
  if (!getCourse(slug)) return notFound("Course");
  return json(findQuestions({ ...filterFromSearchParams(req.nextUrl.searchParams), courses: [slug], limit: 500 }));
}
