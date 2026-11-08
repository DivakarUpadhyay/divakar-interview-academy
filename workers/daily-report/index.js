// DevLadder daily report: every day at 20:00 Taiwan time, read the owner stats from the Pages Function and email a
// formatted summary (HTML with a plain-text fallback) — today, 30 days, month forecast, goals, real-visitor speed,
// top pages/countries/sources and recommended next steps — to REPORT_EMAIL through Resend (secret RESEND_API_KEY).
// The owner key is never included in the message.
const RPM = { low: 1, typical: 3.5, high: 8 };   // keep in sync with src/app/owner/AdminDashboard.tsx
const GOALS = [500, 3000, 5000];
const num = (n) => Math.round(n).toLocaleString("en-US");
const usd = (n) => `$${n < 10 ? n.toFixed(2) : num(n)}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function summarize(d) {
  const all = d.days;
  const days = all.slice(-30);
  const today = days[days.length - 1] ?? { date: "-", pageViews: 0, visits: 0 };
  const last7 = days.slice(-7);
  const avgPv = last7.reduce((s, x) => s + x.pageViews, 0) / Math.max(last7.length, 1);
  const total = days.reduce((s, x) => ({ pv: s.pv + x.pageViews, v: s.v + x.visits }), { pv: 0, v: 0 });
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const dim = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const soFar = all.filter((x) => x.date.startsWith(monthKey)).reduce((s, x) => s + x.pageViews, 0);
  const projected = soFar + avgPv * (dim - now.getUTCDate());
  const goals = GOALS.map((g) => { const need = (g / RPM.typical) * 1000 / 30; return { goal: g, need, pct: Math.min(avgPv / need * 100, 100) }; });
  const vitals = ["lcp", "inp", "cls"].map((k) => ({ k, v: d.vitals?.[k] }));
  return { today, avgPv, total, monthKey, soFar, projected, goals, vitals };
}

function text(d, s, site) {
  return [
    `DevLadder daily report — ${s.today.date}`,
    `Today: ${num(s.today.visits)} visits, ${num(s.today.pageViews)} page views`,
    `Last 30 days: ${num(s.total.v)} visits, ${num(s.total.pv)} page views (avg ${num(s.avgPv)}/day, last 7 days)`,
    `This month (${s.monthKey}): ${num(s.soFar)} so far, ~${num(s.projected)} projected, est. ${usd(s.projected / 1000 * RPM.low)}–${usd(s.projected / 1000 * RPM.high)}`,
    "", "Goals:", ...s.goals.map((g) => `- $${num(g.goal)}/mo: ~${num(g.need)} views/day needed, ${g.pct.toFixed(1)}% there`),
    "", `Speed (real visitors, 7 days, target 90%+ good): ${s.vitals.map(({ k, v }) => `${k.toUpperCase()} ${v ? Math.round(v.good * 100) + "%" : "-"}`).join(", ")}`,
    "", "Next steps:", ...d.tips.map((t, i) => `${i + 1}. ${t}`),
    "", `Dashboard: ${site}/owner (open your bookmarked private link)`,
  ].join("\n");
}

function html(d, s, site) {
  const card = (label, value, sub = "") => `<td style="padding:6px;width:25%" valign="top"><div style="background:#ffffff;border:1px solid #dfe3ec;border-radius:10px;padding:12px">
    <div style="font-size:12px;color:#5b6475">${label}</div><div style="font-size:22px;font-weight:700;color:#161a23;margin-top:4px">${value}</div>
    ${sub ? `<div style="font-size:12px;color:#5b6475;margin-top:2px">${sub}</div>` : ""}</div></td>`;
  const h2 = (t) => `<h2 style="font-size:16px;color:#1e3a6e;margin:22px 0 8px">${t}</h2>`;
  const list = (rows) => rows.length ? `<ol style="margin:0;padding-left:20px;color:#161a23;font-size:14px;line-height:1.6">${rows.map((r) => `<li>${r}</li>`).join("")}</ol>` : `<p style="color:#5b6475;font-size:14px;margin:0">No data yet.</p>`;
  const goal = (g) => `<tr><td style="padding:6px 0;font-size:14px;color:#161a23;width:110px"><b>$${num(g.goal)}/mo</b></td>
    <td style="padding:6px 8px;width:50%"><div style="background:#f0f2f8;border-radius:6px;height:12px;overflow:hidden;width:100%"><div style="background:#2b8a3e;height:12px;width:${Math.max(g.pct, 0.5).toFixed(1)}%"></div></div></td>
    <td style="padding:6px 0;font-size:13px;color:#5b6475;text-align:right">${g.pct.toFixed(1)}%<br>need ~${num(g.need)}/day</td></tr>`;
  const vital = ({ k, v }) => {
    const good = v ? Math.round(v.good * 100) : null;
    const color = good === null ? "#5b6475" : good >= 90 ? "#2b8a3e" : "#c92a2a";
    const label = { lcp: "LCP · loading", inp: "INP · responsiveness", cls: "CLS · layout" }[k];
    return card(label, `<span style="color:${color}">${good === null ? "—" : good + "% good"}</span>`, v ? `${Math.round(v.poor * 100)}% poor · ${num(v.samples)} loads` : "");
  };
  return `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px">
  <tr><td style="background:#1e3a6e;border-radius:12px 12px 0 0;padding:18px 20px;color:#ffffff">
    <div style="font-size:20px;font-weight:700">DevLadder daily report</div>
    <div style="font-size:13px;color:#dbe4f5;margin-top:4px">${esc(s.today.date)} · real visitors only (bots excluded)</div></td></tr>
  <tr><td style="background:#f0f2f8;padding:14px 14px 4px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      ${card("Visits today", num(s.today.visits))}${card("Page views today", num(s.today.pageViews))}
      ${card("Avg views / day", num(s.avgPv), "last 7 days")}${card("Page views", num(s.total.pv), "last 30 days")}
    </tr></table></td></tr>
  <tr><td style="background:#ffffff;border:1px solid #dfe3ec;border-top:0;border-radius:0 0 12px 12px;padding:6px 20px 20px">
    ${h2(`This month (${esc(s.monthKey)})`)}
    <p style="font-size:14px;color:#161a23;margin:0;line-height:1.6">${num(s.soFar)} page views so far, about <b>${num(s.projected)}</b> projected.<br>
      Estimated earnings: <b>${usd(s.projected / 1000 * RPM.low)} – ${usd(s.projected / 1000 * RPM.high)}</b>
      <span style="color:#5b6475">(typical ${usd(s.projected / 1000 * RPM.typical)}; ads start after AdSense approval)</span></p>
    ${h2("Income goals")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${s.goals.map(goal).join("")}</table>
    ${h2("Real-visitor speed · last 7 days (target 90%+ good)")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${s.vitals.map(vital).join("")}</tr></table>
    ${h2("Recommended next steps")}
    ${list(d.tips.map(esc))}
    ${h2("Top pages")}
    ${list(d.pages.slice(0, 5).map((p) => `${esc(p.path)} <span style="color:#5b6475">— ${num(p.pageViews)}</span>`))}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td valign="top" style="width:50%;padding-right:8px">${h2("Countries")}${list(d.countries.slice(0, 5).map((c) => `${esc(c.name)} <span style="color:#5b6475">— ${num(c.pageViews)}</span>`))}</td>
      <td valign="top" style="width:50%;padding-left:8px">${h2("Traffic sources")}${list(d.referrers.slice(0, 5).map((r) => `${esc(r.host)} <span style="color:#5b6475">— ${num(r.pageViews)}</span>`))}</td>
    </tr></table>
    <p style="margin:22px 0 0;font-size:13px;color:#5b6475">Full details: open your bookmarked private dashboard link (${esc(site)}/owner#k=…).</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

async function buildReport(env) {
  const res = await fetch(`${env.SITE}/owner/data`, { headers: { "x-owner-key": env.OWNER_KEY } });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
  const s = summarize(d);
  return {
    title: `DevLadder · ${s.today.date}: ${num(s.today.visits)} visits, ${num(s.today.pageViews)} views (avg ${num(s.avgPv)}/day)`,
    text: text(d, s, env.SITE),
    html: html(d, s, env.SITE),
  };
}

async function send(env, report) {
  // onboarding@resend.dev may only send to the Resend account's own address (REPORT_EMAIL); no domain needed.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "DevLadder Reports <onboarding@resend.dev>", to: [env.REPORT_EMAIL], subject: report.title, text: report.text, html: report.html }),
  });
  return `${res.status} ${await res.text()}`;
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(buildReport(env).then((r) => send(env, r)).catch((e) =>
      send(env, { title: "DevLadder daily report failed", text: String(e?.message || e), html: `<p>${esc(e?.message || e)}</p>` })));
  },
  // Manual run for testing: GET /run with header x-owner-key (add ?dry=1 to build without sending).
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/run" || request.headers.get("x-owner-key") !== env.OWNER_KEY) return new Response("Not found", { status: 404 });
    const report = await buildReport(env);
    if (url.searchParams.get("dry")) return new Response(report.html, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response(`${report.title}\n\nemail: ${await send(env, report)}`, { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
