import { getSearchDocs } from "@/lib/db";

// Built once as a static file; the Search page matches against it in the browser.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getSearchDocs());
}
