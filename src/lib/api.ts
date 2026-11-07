import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "public, max-age=60, s-maxage=3600" } });

export const notFound = (what: string) => NextResponse.json({ error: `${what} not found` }, { status: 404 });
