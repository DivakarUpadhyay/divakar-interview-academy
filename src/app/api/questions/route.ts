import { NextRequest } from "next/server";
import { findQuestions } from "@/lib/db";
import { filterFromSearchParams, json } from "@/lib/api";

/**
 * GET /api/questions?course=a,b&level=Beginner,Scenario&priority=High&q=text&limit=50&offset=0
 * All interview questions across courses, filtered and paged.
 */
export function GET(req: NextRequest) {
  return json(findQuestions(filterFromSearchParams(req.nextUrl.searchParams)));
}
