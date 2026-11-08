// Cloudflare Pages Function: GET /owner/data
// Returns real-visitor numbers (Cloudflare Web Analytics via the GraphQL API) plus rule-based recommendations for the
// owner dashboard and the daily report. Requires the header x-owner-key to equal the Pages secret OWNER_KEY, so the
// numbers stay private even though this code is public. CF_ANALYTICS_TOKEN (Account Analytics: Read) is also a Pages
// secret and is never sent to the browser.
const ACCOUNT_TAG = "b8e4d7f71a8ab54f70cb3054b843181c";
const SITE_TAG = "d1a87d53907d4d1986d0cd3dd6af4415";

// Real users only: Cloudflare's bot flag plus automated/headless browsers (my test tooling also blocks the beacon).
const REAL = `bot: 0, userAgentBrowser_notin: ["HeadlessChrome", "Headless Chrome", "PhantomJS"]`;
const QUERY = `query ($account: string!, $site: string!, $start: Date!, $end: Date!) {
  viewer { accounts(filter: { accountTag: $account }) {
    days: rumPageloadEventsAdaptiveGroups(limit: 200, filter: { siteTag: $site, date_geq: $start, date_leq: $end, ${REAL} }, orderBy: [date_ASC]) {
      count sum { visits } dimensions { date }
    }
    countries: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $site, date_geq: $start, date_leq: $end, ${REAL} }, orderBy: [count_DESC]) {
      count dimensions { countryName }
    }
    pages: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $site, date_geq: $start, date_leq: $end, ${REAL} }, orderBy: [count_DESC]) {
      count dimensions { requestPath }
    }
    referrers: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $site, date_geq: $start, date_leq: $end, ${REAL} }, orderBy: [count_DESC]) {
      count dimensions { refererHost }
    }
  } }
}`;

const VITALS = `query ($account: string!, $site: string!, $start: Date!, $end: Date!) {
  viewer { accounts(filter: { accountTag: $account }) {
    rumWebVitalsEventsAdaptiveGroups(limit: 1, filter: { siteTag: $site, date_geq: $start, date_leq: $end, ${REAL} }) {
      count
      sum { lcpTotal lcpGood lcpNeedsImprovement lcpPoor clsTotal clsGood clsNeedsImprovement clsPoor inpTotal inpGood inpNeedsImprovement inpPoor }
    }
  } }
}`;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" },
});

// Plain-language next steps worked out from the numbers.
function recommend({ days, countries, referrers, pages }) {
  const tips = [];
  const last7 = days.slice(-7);
  const avg = last7.reduce((s, d) => s + d.pageViews, 0) / Math.max(last7.length, 1);
  const prev7 = days.slice(-14, -7);
  const prevAvg = prev7.reduce((s, d) => s + d.pageViews, 0) / Math.max(prev7.length, 1);
  const total = countries.reduce((s, c) => s + c.pageViews, 0) || 1;
  const search = referrers.filter((r) => /google|bing|duckduckgo|yahoo|yandex|baidu|ecosia/i.test(r.host)).reduce((s, r) => s + r.pageViews, 0);
  const devto = referrers.filter((r) => /dev\.to/i.test(r.host)).reduce((s, r) => s + r.pageViews, 0);
  const usEu = countries.filter((c) => /^(US|GB|DE|FR|NL|CA|AU|IE|SE|NO|DK|FI|CH|AT|BE|ES|IT|PL)$/.test(c.name)).reduce((s, c) => s + c.pageViews, 0);

  if (avg < 100) tips.push("Traffic is still very low: publish one new dev.to post every day and add 3–5 new lessons or tool pages a week.");
  else if (avg < 1000) tips.push("Traffic is growing: keep daily dev.to posts and add pages that answer specific searches (error messages, 'X vs Y').");
  if (prev7.length && avg > prevAvg * 1.2) tips.push(`Page views are up ${Math.round((avg / Math.max(prevAvg, 1) - 1) * 100)}% on last week: repeat whatever you posted last week.`);
  if (prev7.length && avg < prevAvg * 0.8) tips.push("Page views dropped more than 20% on last week: check Search Console for indexing problems and keep posting.");
  if (search === 0) tips.push("No visitors from Google or Bing yet: normal for a new site; check Search Console → Pages to see how many pages are indexed.");
  if (devto === 0) tips.push("No visitors from dev.to yet: reply to comments on your posts and add a 'Read the full lesson' link near the top.");
  if (usEu / total < 0.3) tips.push("Under 30% of views come from the US/Europe, where ads pay most: post on dev.to at 13:00 UTC and write .NET/Azure topics popular there.");
  const top = pages[0]?.path;
  if (top && top !== "/") tips.push(`Most-read page is ${top}: write 2–3 related lessons and link them from it.`);
  tips.push("Once AdSense approves the site, publish the European consent message and update the AdSense status on the dashboard.");
  return tips.slice(0, 6);
}

export async function onRequestGet({ env, request }) {
  if (!env.OWNER_KEY || request.headers.get("x-owner-key") !== env.OWNER_KEY) return json({ error: "Not allowed." }, 403);
  if (!env.CF_ANALYTICS_TOKEN) return json({ error: "CF_ANALYTICS_TOKEN is not set for this Pages project." }, 503);
  const day = (d) => d.toISOString().slice(0, 10);
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 86400000); // ~3 months, the free-plan maximum (13 weeks), for monthly totals
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { account: ACCOUNT_TAG, site: SITE_TAG, start: day(start), end: day(end) } }),
  });
  const body = await res.json();
  if (body.errors?.length) return json({ error: body.errors.map((e) => e.message).join("; ") }, 502);

  // Real-visitor Core Web Vitals for the last 7 days: share of loads rated good / needs improvement / poor.
  let vitals = null;
  try {
    const vr = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ query: VITALS, variables: { account: ACCOUNT_TAG, site: SITE_TAG, start: day(new Date(end.getTime() - 7 * 86400000)), end: day(end) } }),
    });
    const vb = await vr.json();
    if (vb.errors?.length) vitals = { error: vb.errors.map((e) => e.message).join("; ") };
    else {
      const sum = vb.data.viewer.accounts[0]?.rumWebVitalsEventsAdaptiveGroups?.[0]?.sum ?? {};
      const pct = (m) => { const t = sum[`${m}Total`] || 0; return t ? { good: sum[`${m}Good`] / t, ni: sum[`${m}NeedsImprovement`] / t, poor: sum[`${m}Poor`] / t, samples: t } : null; };
      vitals = { lcp: pct("lcp"), inp: pct("inp"), cls: pct("cls") };
    }
  } catch (e) { vitals = { error: String(e) }; }
  const a = body.data.viewer.accounts[0] ?? {};
  const data = {
    generatedAt: new Date().toISOString(),
    days: (a.days ?? []).map((g) => ({ date: g.dimensions.date, pageViews: g.count, visits: g.sum.visits })),
    countries: (a.countries ?? []).map((g) => ({ name: g.dimensions.countryName || "Unknown", pageViews: g.count })),
    pages: (a.pages ?? []).map((g) => ({ path: g.dimensions.requestPath, pageViews: g.count })),
    referrers: (a.referrers ?? []).map((g) => ({ host: g.dimensions.refererHost || "(direct / none)", pageViews: g.count })),
  };
  const tips = recommend(data);
  for (const [k, name] of [["lcp", "LCP (loading)"], ["inp", "INP (responsiveness)"], ["cls", "CLS (layout shift)"]]) {
    const v = vitals?.[k];
    if (v && v.good < 0.9) tips.unshift(`Speed alert: only ${Math.round(v.good * 100)}% of real visits have good ${name} (target 90%+), run npm run vitals and fix before it hurts ranking.`);
  }
  return json({ ...data, vitals, tips: tips.slice(0, 7) });
}
