import { INDEXNOW_KEY } from "@/lib/seo";

// IndexNow ownership file: search engines fetch /<key>.txt to confirm the key belongs to this site.
export const dynamic = "force-static";

export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
