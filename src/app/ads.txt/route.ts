// ads.txt tells ad buyers which seller accounts may sell this site's ad space (required by AdSense).
// Built from NEXT_PUBLIC_ADSENSE_CLIENT; empty until the AdSense account exists.
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pub = client?.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
