import { getAllQuestions } from "@/lib/db";

// Built once as a static file; the Interview and Practice panels filter it in the browser.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getAllQuestions());
}
