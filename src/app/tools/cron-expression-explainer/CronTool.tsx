"use client";
import { useEffect, useMemo, useState } from "react";
import { describe, nextRuns, parseCron } from "./cron";

const EXAMPLES = ["*/5 * * * *", "0 9 * * 1-5", "30 2 1 * *", "0 */2 * * *", "15,45 9-17 * * MON-FRI", "0 0 12 * * ?", "@daily"];

export default function CronTool() {
  const [expr, setExpr] = useState("0 9 * * 1-5");
  const [utc, setUtc] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const result = useMemo(() => {
    if (!expr.trim()) return null;
    try {
      const c = parseCron(expr);
      return { text: describe(c), runs: now ? nextRuns(c, now, 5, utc) : [], error: "" };
    } catch (e) { return { text: "", runs: [], error: e instanceof Error ? e.message : "Invalid expression" }; }
  }, [expr, utc, now]);

  return (
    <div className="tool">
      <label className="tool-label" htmlFor="cron-in">Cron expression</label>
      <input id="cron-in" className="tool-input mono" value={expr} spellCheck={false} onChange={(e) => setExpr(e.target.value)} />
      <div className="row tool-actions">
        {EXAMPLES.map((x) => <button key={x} className="btn small" onClick={() => setExpr(x)}>{x}</button>)}
      </div>
      {result?.error && <p className="tool-err" role="status">{result.error}</p>}
      {result?.text && (
        <>
          <p className="tool-ok" role="status" style={{ fontSize: "1.1rem" }}>{result.text}</p>
          <div className="row"><span className="tool-label">Next 5 runs</span><span className="spacer" />
            <label className="check"><input type="checkbox" checked={utc} onChange={(e) => setUtc(e.target.checked)} /> UTC</label></div>
          <ol className="tool-times mono">
            {result.runs.map((d) => <li key={d.getTime()}>{utc ? d.toISOString().replace("T", " ").slice(0, 19) + " UTC" : d.toLocaleString()}</li>)}
            {now && !result.runs.length && <li>No run in the next two years.</li>}
          </ol>
        </>
      )}
      <pre className="tool-pre">{`┌───────────── minute (0-59)
│ ┌─────────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌─────── month (1-12 or JAN-DEC)
│ │ │ │ ┌───── day of week (0-6 or SUN-SAT, 7 = Sunday)
* * * * *`}</pre>
    </div>
  );
}
