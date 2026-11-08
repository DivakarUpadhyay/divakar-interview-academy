// DevLadder daily report: every day at 20:00 Taiwan time, read the owner stats from the Pages Function and email a
// summary with goal progress and recommendations to REPORT_EMAIL through Resend (secret RESEND_API_KEY).
// The owner key is never included in the message.
const RPM = { low: 1, typical: 3.5, high: 8 };   // keep in sync with src/app/owner/AdminDashboard.tsx
const GOALS = [500, 3000, 5000];
const num = (n) => Math.round(n).toLocaleString("en-US");
const usd = (n) => `$${n < 10 ? n.toFixed(2) : num(n)}`;

async function buildReport(env) {
  const res = await fetch(`${env.SITE}/owner/data`, { headers: { "x-owner-key": env.OWNER_KEY } });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);

  const days = d.days;
  const today = days[days.length - 1] ?? { date: "-", pageViews: 0, visits: 0 };
  const last7 = days.slice(-7);
  const avgPv = last7.reduce((s, x) => s + x.pageViews, 0) / Math.max(last7.length, 1);
  const total = days.reduce((s, x) => ({ pv: s.pv + x.pageViews, v: s.v + x.visits }), { pv: 0, v: 0 });
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const dim = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const soFar = days.filter((x) => x.date.startsWith(monthKey)).reduce((s, x) => s + x.pageViews, 0);
  const projected = soFar + avgPv * (dim - now.getUTCDate());
  const goals = GOALS.map((g) => {
    const need = (g / RPM.typical) * 1000 / 30;
    return `• $${num(g)}/mo: need ~${num(need)} views/day → ${((avgPv / need) * 100).toFixed(1)}% there`;
  });

  const lines = [
    `Today (${today.date}): ${num(today.visits)} visits, ${num(today.pageViews)} page views`,
    `Last 30 days: ${num(total.v)} visits, ${num(total.pv)} page views · 7-day avg ${num(avgPv)} views/day`,
    `This month: ${num(soFar)} views so far, ~${num(projected)} projected → est. ${usd(projected / 1000 * RPM.low)}–${usd(projected / 1000 * RPM.high)} (ads start after AdSense approval)`,
    "",
    "Goals:", ...goals,
    "",
    `Top pages: ${d.pages.slice(0, 3).map((p) => `${p.path} (${p.pageViews})`).join(", ") || "-"}`,
    `Countries: ${d.countries.slice(0, 4).map((c) => `${c.name} ${c.pageViews}`).join(", ") || "-"}`,
    `Sources: ${d.referrers.slice(0, 4).map((r) => `${r.host} ${r.pageViews}`).join(", ") || "-"}`,
    "",
    "Next steps:", ...d.tips.map((t, i) => `${i + 1}. ${t}`),
    "",
    `Full dashboard: ${env.SITE}/owner (use your bookmarked private link)`,
  ];
  return { title: `DevLadder daily: ${num(today.pageViews)} views today, ${num(avgPv)}/day avg`, body: lines.join("\n") };
}

async function send(env, report) {
  // onboarding@resend.dev may only send to the Resend account's own address (REPORT_EMAIL); no domain needed.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "DevLadder Reports <onboarding@resend.dev>", to: [env.REPORT_EMAIL], subject: report.title, text: report.body }),
  });
  return `${res.status} ${await res.text()}`;
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(buildReport(env).then((r) => send(env, r)).catch((e) =>
      send(env, { title: "DevLadder daily report failed", body: String(e?.message || e) })));
  },
  // Manual run for testing: GET /run with header x-owner-key.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/run" || request.headers.get("x-owner-key") !== env.OWNER_KEY) return new Response("Not found", { status: 404 });
    const report = await buildReport(env);
    return new Response(`${report.title}\n\n${report.body}\n\nemail: ${await send(env, report)}`, { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
