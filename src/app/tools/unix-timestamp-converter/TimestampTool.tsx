"use client";
import { useEffect, useMemo, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// 10 digits or fewer = seconds; 13 digits = milliseconds (also accepts micro/nanoseconds by length).
export function parseEpoch(text: string): { ms: number; unit: string } | null {
  const t = text.trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t), digits = t.replace(/^-/, "").split(".")[0].length;
  if (digits <= 11) return { ms: n * 1000, unit: "seconds" };
  if (digits <= 14) return { ms: n, unit: "milliseconds" };
  if (digits <= 17) return { ms: n / 1000, unit: "microseconds" };
  return { ms: n / 1e6, unit: "nanoseconds" };
}

function relative(ms: number) {
  const s = Math.round((ms - Date.now()) / 1000), a = Math.abs(s);
  const [v, u] = a < 60 ? [a, "second"] : a < 3600 ? [Math.round(a / 60), "minute"] : a < 86400 ? [Math.round(a / 3600), "hour"] : a < 31557600 ? [Math.round(a / 86400), "day"] : [Math.round(a / 31557600), "year"];
  const txt = `${v} ${u}${v === 1 ? "" : "s"}`;
  return s >= 0 ? `in ${txt}` : `${txt} ago`;
}

export default function TimestampTool() {
  const [now, setNow] = useState<number | null>(null);
  const [epoch, setEpoch] = useState("");
  const [local, setLocal] = useState("");

  useEffect(() => {
    const n = Date.now();
    setNow(n); setEpoch(String(Math.floor(n / 1000))); setLocal(toLocalInput(new Date(n)));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo(() => parseEpoch(epoch), [epoch]);
  const fromLocal = useMemo(() => { const d = new Date(local); return isNaN(d.getTime()) ? null : d; }, [local]);
  const copy = (s: string) => navigator.clipboard.writeText(s);

  return (
    <div className="tool">
      <p className="tool-ok">Current Unix time: <span className="mono">{now === null ? "…" : Math.floor(now / 1000)}</span>
        {now !== null && <button className="btn small" style={{ marginLeft: 8 }} onClick={() => copy(String(Math.floor(now / 1000)))}>Copy</button>}</p>

      <h3>Timestamp → date</h3>
      <input className="tool-input mono" value={epoch} onChange={(e) => setEpoch(e.target.value)} placeholder="1764000000 or 1764000000000" aria-label="Unix timestamp" />
      {epoch.trim() && !parsed && <p className="tool-err" role="status">Enter digits only, for example 1764000000.</p>}
      {parsed && !isNaN(new Date(parsed.ms).getTime()) && (
        <ul className="tool-times">
          <li>Read as <b>{parsed.unit}</b></li>
          <li>UTC: <span className="mono">{new Date(parsed.ms).toISOString()}</span></li>
          <li>Your time zone: <span className="mono">{new Date(parsed.ms).toString()}</span></li>
          <li>Relative: {relative(parsed.ms)}</li>
        </ul>
      )}

      <h3>Date → timestamp</h3>
      <input type="datetime-local" step={1} className="tool-input" value={local} onChange={(e) => setLocal(e.target.value)} aria-label="Local date and time" />
      {fromLocal && (
        <ul className="tool-times">
          <li>Seconds: <span className="mono">{Math.floor(fromLocal.getTime() / 1000)}</span> <button className="btn small" onClick={() => copy(String(Math.floor(fromLocal.getTime() / 1000)))}>Copy</button></li>
          <li>Milliseconds: <span className="mono">{fromLocal.getTime()}</span></li>
          <li>UTC: <span className="mono">{fromLocal.toISOString()}</span></li>
        </ul>
      )}
    </div>
  );
}
