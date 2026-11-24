"use client";
import { useEffect, useState } from "react";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));

export default function HashTool() {
  const [input, setInput] = useState("Hello, DevLadder!");
  const [upper, setUpper] = useState(false);
  const [base64, setBase64] = useState(false);
  const [hashes, setHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    let live = true;
    const bytes = new TextEncoder().encode(input);
    Promise.all(ALGOS.map((a) => crypto.subtle.digest(a, bytes))).then((rs) => {
      if (!live) return;
      setHashes(Object.fromEntries(rs.map((r, i) => {
        const v = base64 ? b64(r) : hex(r);
        return [ALGOS[i], upper && !base64 ? v.toUpperCase() : v];
      })));
    });
    return () => { live = false; };
  }, [input, upper, base64]);

  return (
    <div className="tool">
      <label className="tool-label" htmlFor="hash-in">Text (UTF-8)</label>
      <textarea id="hash-in" className="tool-text" rows={5} spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="row tool-actions">
        <label className="check"><input type="checkbox" checked={base64} onChange={(e) => setBase64(e.target.checked)} /> Base64 output</label>
        <label className="check"><input type="checkbox" checked={upper} disabled={base64} onChange={(e) => setUpper(e.target.checked)} /> Uppercase hex</label>
      </div>
      {ALGOS.map((a) => (
        <div key={a}>
          <div className="row"><span className="tool-label">{a}</span><span className="spacer" />
            <button className="btn small" onClick={() => navigator.clipboard.writeText(hashes[a] ?? "")}>Copy</button></div>
          <pre className="tool-pre" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{hashes[a] ?? "…"}</pre>
        </div>
      ))}
    </div>
  );
}
