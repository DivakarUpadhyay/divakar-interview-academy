// Cloudflare Pages Function: GET /ops-fe23babe4536cfc1/data
// Reads real-visitor numbers (Cloudflare Web Analytics, bots excluded by the JS beacon) through the GraphQL Analytics API
// and returns them as JSON for the hidden admin page. The API token lives only in the Pages secret CF_ANALYTICS_TOKEN
// (set with: npx wrangler pages secret put CF_ANALYTICS_TOKEN --project-name devladder) and is never sent to the browser.
const ACCOUNT_TAG = "b8e4d7f71a8ab54f70cb3054b843181c";
const SITE_TAG = "d1a87d53907d4d1986d0cd3dd6af4415";

const QUERY = `query ($account: string!, $site: string!, $start: Date!, $end: Date!) {
  viewer { accounts(filter: { accountTag: $account }) {
    days: rumPageloadEventsAdaptiveGroups(limit: 100, filter: { siteTag: $site, date_geq: $start, date_leq: $end }, orderBy: [date_ASC]) {
      count sum { visits } dimensions { date }
    }
    countries: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $site, date_geq: $start, date_leq: $end }, orderBy: [count_DESC]) {
      count dimensions { countryName }
    }
    pages: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $site, date_geq: $start, date_leq: $end }, orderBy: [count_DESC]) {
      count dimensions { requestPath }
    }
    referrers: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $site, date_geq: $start, date_leq: $end }, orderBy: [count_DESC]) {
      count dimensions { refererHost }
    }
  } }
}`;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, max-age=300", "x-robots-tag": "noindex, nofollow" },
});

export async function onRequestGet({ env }) {
  if (!env.CF_ANALYTICS_TOKEN) return json({ error: "CF_ANALYTICS_TOKEN is not set for this Pages project." }, 503);
  const day = (d) => d.toISOString().slice(0, 10);
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86400000);
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { account: ACCOUNT_TAG, site: SITE_TAG, start: day(start), end: day(end) } }),
  });
  const body = await res.json();
  if (body.errors?.length) return json({ error: body.errors.map((e) => e.message).join("; ") }, 502);
  const a = body.data.viewer.accounts[0] ?? {};
  return json({
    generatedAt: new Date().toISOString(),
    days: (a.days ?? []).map((g) => ({ date: g.dimensions.date, pageViews: g.count, visits: g.sum.visits })),
    countries: (a.countries ?? []).map((g) => ({ name: g.dimensions.countryName || "Unknown", pageViews: g.count })),
    pages: (a.pages ?? []).map((g) => ({ path: g.dimensions.requestPath, pageViews: g.count })),
    referrers: (a.referrers ?? []).map((g) => ({ host: g.dimensions.refererHost || "(direct / none)", pageViews: g.count })),
  });
}
