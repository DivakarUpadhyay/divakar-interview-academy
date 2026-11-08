"use client";
import { useEffect, useState } from "react";

type Day = { date: string; pageViews: number; visits: number };
type Data = { generatedAt: string; days: Day[]; countries: { name: string; pageViews: number }[];
  pages: { path: string; pageViews: number }[]; referrers: { host: string; pageViews: number }[]; tips: string[]; error?: string;
  vitals: null | { error?: string } & Partial<Record<"lcp" | "inp" | "cls", null | { good: number; ni: number; poor: number; samples: number }>> };

// AdSense earnings per 1,000 page views (RPM), as a low / typical / high range for a developer-tutorial site with
// mixed worldwide traffic. These are estimates, not Google figures; replace them with your real RPM from AdSense →
// Reports once ads are running.
const RPM = { low: 1, typical: 3.5, high: 8 };
const PAYOUT = 100; // AdSense pays once the balance reaches US$100
const GOALS = [500, 3000, 5000]; // monthly income targets (US$) tracked on the dashboard and in the daily report
// Update by hand when AdSense changes: "pending" | "approved".
const ADSENSE_STATUS: "pending" | "approved" = "pending";

const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString()}`;
const num = (n: number) => Math.round(n).toLocaleString();

export default function AdminDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // The private key travels in the link's #fragment, which browsers never send to servers or logs.
    const key = new URLSearchParams(location.hash.slice(1)).get("k") ?? "";
    if (!key) { setError("Open this page with your private link (…/owner#k=…)."); return; }
    fetch("/owner/data", { headers: { "x-owner-key": key } })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || r.statusText); setData(j); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="policy"><h1>Owner dashboard</h1><p className="tool-err">Could not load stats: {error}</p></div>;
  if (!data) return <div className="policy"><h1>Owner dashboard</h1><p className="muted">Loading the last 30 days…</p></div>;

  const allDays = data.days;
  const days = allDays.slice(-30);
  // Monthly totals and estimated earnings (AdSense's real figures appear in AdSense → Reports once ads run).
  const months = Object.entries(allDays.reduce<Record<string, { pv: number; v: number }>>((m, d) => {
    const k = d.date.slice(0, 7); (m[k] ??= { pv: 0, v: 0 }).pv += d.pageViews; m[k].v += d.visits; return m;
  }, {})).sort(([a], [b]) => b.localeCompare(a));
  const total = days.reduce((s, d) => ({ pv: s.pv + d.pageViews, v: s.v + d.visits }), { pv: 0, v: 0 });
  const last7 = days.slice(-7);
  const avgPv = last7.reduce((s, d) => s + d.pageViews, 0) / Math.max(last7.length, 1);
  const avgVisits = last7.reduce((s, d) => s + d.visits, 0) / Math.max(last7.length, 1);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthKey = now.toISOString().slice(0, 7);
  const monthSoFar = allDays.filter((d) => d.date.startsWith(monthKey)).reduce((s, d) => s + d.pageViews, 0);
  const remainingDays = daysInMonth - now.getDate();
  const projectedPv = monthSoFar + avgPv * remainingDays;
  const earn = (rpm: number) => (projectedPv / 1000) * rpm;
  const monthsToPayout = (rpm: number) => (avgPv > 0 ? PAYOUT / ((avgPv * 30 / 1000) * rpm) : Infinity);
  const max = Math.max(...days.map((d) => d.pageViews), 1);

  let verdict: string;
  if (ADSENSE_STATUS !== "approved") verdict = "No payment this month: AdSense has not approved the site yet, so no ads are shown.";
  else if (earn(RPM.high) < PAYOUT) verdict = `Unlikely this month: even at a high RPM the month would earn about ${usd(earn(RPM.high))}, below the $${PAYOUT} payout. Earnings carry over to next month.`;
  else if (earn(RPM.low) >= PAYOUT) verdict = "Likely: even at a low RPM this month should pass the $100 payout threshold.";
  else verdict = `Possible: you pass $${PAYOUT} only if RPM is above about ${usd(PAYOUT / (projectedPv / 1000))} per 1,000 views.`;

  return (
    <div className="policy admin-dash">
      <h1>Owner dashboard</h1>
      <p className="muted small">Real visitors from Cloudflare Web Analytics (bots excluded), last 30 days. Updated {new Date(data.generatedAt).toLocaleString()}.</p>

      <div className="admin-kpis">
        <div className="card"><span className="muted small">Visits (30 days)</span><b>{num(total.v)}</b></div>
        <div className="card"><span className="muted small">Page views (30 days)</span><b>{num(total.pv)}</b></div>
        <div className="card"><span className="muted small">Avg page views / day (7 days)</span><b>{num(avgPv)}</b></div>
        <div className="card"><span className="muted small">Avg visits / day (7 days)</span><b>{num(avgVisits)}</b></div>
      </div>

      <h2>This month forecast ({monthKey})</h2>
      <div className="card">
        <p><b>Will I get paid this month?</b> {verdict}</p>
        <ul>
          <li>Page views so far this month: <b>{num(monthSoFar)}</b>; projected for the whole month: <b>{num(projectedPv)}</b></li>
          <li>Estimated earnings this month: <b>{usd(earn(RPM.low))}</b> (low) · <b>{usd(earn(RPM.typical))}</b> (typical) · <b>{usd(earn(RPM.high))}</b> (high)</li>
          <li>At the current pace, reaching the ${PAYOUT} payout takes about{" "}
            <b>{Number.isFinite(monthsToPayout(RPM.typical)) ? `${monthsToPayout(RPM.typical).toFixed(1)} months` : "—"}</b> (typical RPM).</li>
        </ul>
        <p className="muted small">AdSense status: <b>{ADSENSE_STATUS}</b>. Estimates use ${RPM.low}–${RPM.high} per 1,000 page views; your real RPM appears in AdSense → Reports after approval.</p>
      </div>

      <h2>Real-visitor speed (last 7 days)</h2>
      {data.vitals && !data.vitals.error ? (
        <div className="admin-kpis">
          {([["lcp", "LCP · loading"], ["inp", "INP · responsiveness"], ["cls", "CLS · layout stability"]] as const).map(([k, label]) => {
            const v = data.vitals?.[k];
            return (
              <div key={k} className="card">
                <span className="muted small">{label}</span>
                {v ? <b className={v.good >= 0.9 ? "admin-good" : "admin-bad"}>{Math.round(v.good * 100)}% good</b> : <b>—</b>}
                {v && <span className="small muted">{Math.round(v.ni * 100)}% needs improvement · {Math.round(v.poor * 100)}% poor · {num(v.samples)} loads</span>}
              </div>
            );
          })}
        </div>
      ) : <p className="muted small">Speed data unavailable{data.vitals?.error ? `: ${data.vitals.error}` : ""}.</p>}

      <h2>Earnings by month (estimated)</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Month</th><th>Visits</th><th>Page views</th><th>Low</th><th>Typical</th><th>High</th></tr></thead>
        <tbody>{months.map(([m, t]) => (
          <tr key={m}><td>{m}{m === monthKey ? " (so far)" : ""}</td><td>{num(t.v)}</td><td>{num(t.pv)}</td>
            <td>{usd(t.pv / 1000 * RPM.low)}</td><td><b>{usd(t.pv / 1000 * RPM.typical)}</b></td><td>{usd(t.pv / 1000 * RPM.high)}</td></tr>
        ))}</tbody>
      </table></div>
      <p className="muted small">Estimates only; no ads run until AdSense approves the site. Real earnings: AdSense → Reports / Payments.</p>

      <h2>Income goals</h2>
      <div className="admin-goals">
        {GOALS.map((goal) => {
          const need = (goal / RPM.typical) * 1000 / 30;          // page views per day at typical RPM
          const pct = Math.min((avgPv / need) * 100, 100);
          return (
            <div key={goal} className="card">
              <b>${goal.toLocaleString()} / month</b>
              <span className="muted small">Needs about {num(need)} page views a day (typical RPM; {num((goal / RPM.high) * 1000 / 30)}–{num((goal / RPM.low) * 1000 / 30)} across the range)</span>
              <div className="admin-progress"><div style={{ width: `${Math.max(pct, 0.5)}%` }} /></div>
              <span className="small">Now {num(avgPv)} a day → <b>{pct < 0.1 ? "<0.1" : pct.toFixed(1)}%</b> of the way · {num(Math.max(need - avgPv, 0))} more a day to go</span>
            </div>
          );
        })}
      </div>

      <h2>Recommended next steps</h2>
      <div className="card"><ol>{data.tips.map((t) => <li key={t}>{t}</li>)}</ol></div>

      <h2>Daily visits and page views</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Visits</th><th>Page views</th><th style={{ width: "45%" }}></th></tr></thead>
        <tbody>{[...days].reverse().map((d) => (
          <tr key={d.date}><td>{d.date}</td><td>{num(d.visits)}</td><td>{num(d.pageViews)}</td>
            <td><div className="admin-bar" style={{ width: `${(d.pageViews / max) * 100}%` }} /></td></tr>
        ))}</tbody>
      </table></div>

      <div className="admin-cols">
        <div><h2>Top pages</h2><ol>{data.pages.map((p) => <li key={p.path}><code>{p.path}</code> — {num(p.pageViews)}</li>)}</ol></div>
        <div><h2>Countries</h2><ol>{data.countries.map((c) => <li key={c.name}>{c.name} — {num(c.pageViews)}</li>)}</ol></div>
        <div><h2>Where visitors come from</h2><ol>{data.referrers.map((r) => <li key={r.host}>{r.host} — {num(r.pageViews)}</li>)}</ol></div>
      </div>
    </div>
  );
}
