import { NextRequest } from "next/server";
import { search } from "@/lib/db";
import { json, snippetHtml } from "@/lib/api";

/** GET /api/search?q=text — full-text search (SQLite FTS5) over lessons, questions, cheat sheets and courses. */
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return json(search(q).map((h) => ({ ...h, snippet: snippetHtml(h.snippet) })));
}
