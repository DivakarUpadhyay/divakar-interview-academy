import { NextRequest, NextResponse } from "next/server";
import { findQuestions } from "@/lib/db";
import { filterFromSearchParams } from "@/lib/api";

/** GET /api/questions/random?course=&level=&priority=&count=10 — a shuffled set for mock interviews. */
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const count = Math.min(Math.max(Number(sp.get("count")) || 10, 1), 100);
  const data = findQuestions({ ...filterFromSearchParams(sp), limit: count, offset: 0, random: true });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
