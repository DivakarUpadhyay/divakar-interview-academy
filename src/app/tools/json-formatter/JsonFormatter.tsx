"use client";
import { useState } from "react";

const SAMPLE = `{"name":"DevLadder","courses":61,"free":true,"tracks":[".NET","SQL Server","Azure"],"author":{"name":"Divakar","years":9}}`;

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}

/** Turns "Unexpected token } in JSON at position 42" into a line/column the user can find. */
function locate(text: string, message: string) {
  const pos = Number(message.match(/position (\d+)/)?.[1] ?? message.match(/column (\d+)/)?.[1] ?? NaN);
  const lineCol = message.match(/line (\d+) column (\d+)/);
  if (lineCol) return `line ${lineCol[1]}, column ${lineCol[2]}`;
  if (Number.isNaN(pos)) return "";
  const before = text.slice(0, pos).split("\n");
  return `line ${before.length}, column ${before[before.length - 1].length + 1}`;
}

export default function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [indent, setIndent] = useState("2");
  const [sorted, setSorted] = useState(false);

  const run = (mode: "format" | "minify") => {
    try {
      let value = JSON.parse(input);
      if (sorted) value = sortKeys(value);
      const space = indent === "tab" ? "\t" : Number(indent);
      setOutput(mode === "minify" ? JSON.stringify(value) : JSON.stringify(value, null, space));
      setStatus({ ok: true, text: `Valid JSON${mode === "minify" ? " — minified" : ""}.` });
    } catch (e) {
      const msg = (e as Error).message;
      const where = locate(input, msg);
      setOutput("");
      setStatus({ ok: false, text: `Invalid JSON${where ? ` at ${where}` : ""}: ${msg}` });
    }
  };

  return (
    <div className="tool">
      <label className="tool-label" htmlFor="json-in">Paste your JSON</label>
      <textarea id="json-in" className="tool-text" rows={10} spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="row tool-actions">
        <button className="btn primary" onClick={() => run("format")}>Format / Validate</button>
        <button className="btn" onClick={() => run("minify")}>Minify</button>
        <label className="check">Indent{" "}
          <select value={indent} onChange={(e) => setIndent(e.target.value)} aria-label="Indent">
            <option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} /> Sort keys</label>
        <button className="btn" onClick={() => { setInput(""); setOutput(""); setStatus(null); }}>Clear</button>
      </div>
      {status && <p className={status.ok ? "tool-ok" : "tool-err"} role="status">{status.text}</p>}
      {output && (
        <>
          <div className="row"><span className="tool-label">Result</span><span className="spacer" />
            <button className="btn small" onClick={() => navigator.clipboard.writeText(output)}>Copy</button></div>
          <textarea className="tool-text" rows={14} readOnly spellCheck={false} value={output} />
        </>
      )}
    </div>
  );
}
