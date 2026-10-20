"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JS_PRESETS, PITCH_TEMPLATES, SQL_PRESETS, SQL_SCHEMA } from "./presets";
import { useStored } from "@/lib/progress";

const TABS = ["JavaScript runner", "SQL playground", "My pitch & templates", "C# coding demos"] as const;

export default function DemoKit() {
  const [tab, setTab] = useStored<string>("demo-tab", TABS[0]);
  return (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <a key={t} href="#" className={tab === t ? "active" : ""} onClick={(e) => { e.preventDefault(); setTab(t); }}>{t}</a>
        ))}
      </nav>
      {tab === TABS[0] && <JsRunner />}
      {tab === TABS[1] && <SqlPlayground />}
      {tab === TABS[2] && <Pitch />}
      {tab === TABS[3] && (
        <div className="card">
          <p style={{ marginTop: 0 }}>
            C# cannot run inside the browser here, so the C# coding-round programs (string, array, LINQ, OOP, async, patterns) live
            in the <Link href="/courses/coding-practice">Coding Practice course</Link> with full code, complexity and expected output.
            Run them in Visual Studio, <code>dotnet run</code>, or an online compiler such as dotnetfiddle.net during a screen share.
          </p>
          <div className="row">
            <Link className="btn primary" href="/courses/coding-practice">Open C# coding programs</Link>
            <Link className="btn" href="/courses/design-patterns">Design pattern demos</Link>
            <Link className="btn" href="/courses/solid">SOLID demos</Link>
            <Link className="btn" href="/courses/linq">LINQ demos</Link>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- JavaScript runner: code runs in a sandboxed iframe with no access to this page ---------------- */
function JsRunner() {
  const [code, setCode] = useStored<string>("demo-js", JS_PRESETS[0].code);
  const [lines, setLines] = useState<{ kind: string; text: string }[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const runId = useRef(0);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.run !== runId.current) return;
      setLines((l) => [...l, { kind: e.data.kind, text: e.data.text }]);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const run = () => {
    setLines([]);
    const id = ++runId.current;
    const src = `<script>
const send=(kind,args)=>parent.postMessage({run:${id},kind,text:args.map(a=>{try{return typeof a==="string"?a:JSON.stringify(a)}catch{return String(a)}}).join(" ")},"*");
console.log=(...a)=>send("log",a);console.info=console.log;console.warn=(...a)=>send("warn",a);console.error=(...a)=>send("err",a);
window.onerror=(m)=>send("err",[String(m)]);window.onunhandledrejection=(e)=>send("err",["Unhandled rejection: "+(e.reason&&e.reason.message||e.reason)]);
<\/script><script>${code.replace(/<\/script/gi, "<\\/script")}<\/script>`;
    if (frame.current) frame.current.srcdoc = src;
  };

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 10 }}>
        <select onChange={(e) => { const p = JS_PRESETS[Number(e.target.value)]; if (p) { setCode(p.code); setLines([]); } }} defaultValue="">
          <option value="" disabled>Load a demo…</option>
          {JS_PRESETS.map((p, i) => <option key={p.title} value={i}>{p.title}</option>)}
        </select>
        <span className="spacer" />
        <button className="btn primary" onClick={run}>▶ Run</button>
      </div>
      <textarea rows={16} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
      <div className="small muted" style={{ margin: "8px 0 4px" }}>Console output</div>
      <div className="output">
        {lines.length ? lines.map((l, i) => <div key={i} className={l.kind === "err" ? "err" : ""}>{l.text}</div>) : <span className="muted">Press Run.</span>}
      </div>
      <iframe ref={frame} sandbox="allow-scripts" title="JavaScript sandbox" style={{ display: "none" }} />
    </div>
  );
}

/* ---------------- SQL playground: SQLite compiled to WebAssembly (sql.js) running in the browser ---------------- */
type SqlJs = { Database: new () => SqlDb };
type SqlDb = { run: (sql: string) => void; exec: (sql: string) => { columns: string[]; values: unknown[][] }[] };
declare global { interface Window { initSqlJs?: (cfg: { locateFile: (f: string) => string }) => Promise<SqlJs> } }

function loadSqlJs(): Promise<SqlJs> {
  return new Promise((resolve, reject) => {
    const go = () => window.initSqlJs!({ locateFile: (f) => `/sqljs/${f}` }).then(resolve, reject);
    if (window.initSqlJs) return go();
    const s = document.createElement("script");
    s.src = "/sqljs/sql-wasm.js";
    s.onload = go;
    s.onerror = () => reject(new Error("Could not load the SQL engine"));
    document.head.appendChild(s);
  });
}

function SqlPlayground() {
  const db = useRef<SqlDb | null>(null);
  const [ready, setReady] = useState(false);
  const [sql, setSql] = useStored<string>("demo-sql", SQL_PRESETS[0].sql);
  const [results, setResults] = useState<{ columns: string[]; values: unknown[][] }[]>([]);
  const [error, setError] = useState("");

  const reset = async () => {
    const SQL = await loadSqlJs();
    db.current = new SQL.Database();
    db.current.run(SQL_SCHEMA);
    setReady(true);
  };
  useEffect(() => { reset().catch((e) => setError(String(e.message ?? e))); }, []);

  const run = () => {
    if (!db.current) return;
    setError("");
    try { setResults(db.current.exec(sql)); } catch (e) { setResults([]); setError((e as Error).message); }
  };

  return (
    <div className="card">
      <p className="muted small" style={{ marginTop: 0 }}>
        Tables: <code>Departments</code>, <code>Employees</code> (with <code>ManagerId</code>), <code>Customers</code>, <code>Products</code>,{" "}
        <code>Orders</code>, <code>OrderItems</code>. The engine is SQLite: most interview SQL (joins, CTEs, window functions) is the same as
        T-SQL; differences are noted in comments (<code>TOP</code>/<code>OFFSET FETCH</code> vs <code>LIMIT</code>, date functions).
      </p>
      <div className="row" style={{ marginBottom: 10 }}>
        <select onChange={(e) => { const p = SQL_PRESETS[Number(e.target.value)]; if (p) { setSql(p.sql); setResults([]); setError(""); } }} defaultValue="">
          <option value="" disabled>Load a classic interview query…</option>
          {SQL_PRESETS.map((p, i) => <option key={p.title} value={i}>{p.title}</option>)}
        </select>
        <span className="spacer" />
        <button className="btn" onClick={() => { reset(); setResults([]); }} title="Recreate the sample data">Reset data</button>
        <button className="btn primary" onClick={run} disabled={!ready}>{ready ? "▶ Run SQL" : "Loading engine…"}</button>
      </div>
      <textarea rows={12} value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run(); }} />
      <div className="small muted" style={{ margin: "6px 0" }}>Ctrl+Enter runs. Every statement's result set is shown.</div>
      {error && <div className="output"><span className="err">{error}</span></div>}
      {results.map((r, i) => (
        <div key={i} className="result-table" style={{ marginBottom: 12 }}>
          <table>
            <thead><tr>{r.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{r.values.map((row, j) => <tr key={j}>{row.map((v, k) => <td key={k}>{v === null ? <i className="muted">NULL</i> : String(v)}</td>)}</tr>)}</tbody>
          </table>
          <div className="small muted">{r.values.length} row(s)</div>
        </div>
      ))}
      {!error && !results.length && <div className="small muted">Statements that return no rows (INSERT/UPDATE/DELETE) show nothing; run a SELECT to check.</div>}
    </div>
  );
}

/* ---------------- Pitch: personal notes kept in this browser ---------------- */
function Pitch() {
  const [intro, setIntro] = useStored("pitch-intro", PITCH_TEMPLATES.intro);
  const [project, setProject] = useStored("pitch-project", PITCH_TEMPLATES.project);
  const [star, setStar] = useStored("pitch-star", PITCH_TEMPLATES.star);
  const [qs, setQs] = useStored("pitch-questions", PITCH_TEMPLATES.questions);
  const box = (title: string, hint: string, v: string, set: (s: string) => void, rows: number) => (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted small" style={{ marginTop: 0 }}>{hint}</p>
      <textarea rows={rows} value={v} onChange={(e) => set(e.target.value)} />
    </div>
  );
  return (
    <>
      <p className="muted">Fill these in once and keep them open in another tab during interviews. Saved only in this browser.</p>
      {box("Tell me about yourself (60–90 seconds)", "Present → past → future. One measurable result. End with why this role.", intro, setIntro, 7)}
      {box("Project walkthrough", "The most-asked technical round question: explain one project end to end.", project, setProject, 9)}
      {box("STAR story", "Use for every behavioural question: conflict, failure, deadline, leadership, disagreement.", star, setStar, 6)}
      {box("Questions to ask the interviewer", "Always have 2–3 ready. Never say 'no questions'.", qs, setQs, 6)}
    </>
  );
}
