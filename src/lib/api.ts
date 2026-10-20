import { NextResponse } from "next/server";

const list = (v: string | null) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined);
const int = (v: string | null, d: number) => (v && /^\d+$/.test(v) ? Number(v) : d);

export function filterFromSearchParams(sp: URLSearchParams) {
  return {
    courses: list(sp.get("course")),
    levels: list(sp.get("level")),
    priorities: list(sp.get("priority")),
    q: sp.get("q") ?? undefined,
    limit: int(sp.get("limit"), 50),
    offset: int(sp.get("offset"), 0),
  };
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "public, max-age=60, s-maxage=3600" } });

export const notFound = (what: string) => NextResponse.json({ error: `${what} not found` }, { status: 404 });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** FTS snippets are marked with \u0002…\u0003; escape the text, then turn markers into <mark>. */
export const snippetHtml = (s: string) => esc(s).replace(/\u0002/g, "<mark>").replace(/\u0003/g, "</mark>");
