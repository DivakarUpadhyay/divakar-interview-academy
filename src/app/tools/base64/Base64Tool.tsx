"use client";
import { useState } from "react";

// UTF-8 safe Base64 (btoa/atob only handle Latin-1 on their own).
const encode = (s: string, urlSafe: boolean) => {
  const b64 = btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
  return urlSafe ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b64;
};
const decode = (s: string) => {
  let b64 = s.trim().replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (b64.length % 4) b64 += "=";
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
};

export default function Base64Tool() {
  const [input, setInput] = useState("Hello, DevLadder! 你好 👋");
  const [output, setOutput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState("");

  const run = (mode: "enc" | "dec") => {
    try { setOutput(mode === "enc" ? encode(input, urlSafe) : decode(input)); setError(""); }
    catch { setOutput(""); setError(mode === "dec" ? "This is not valid Base64 (or it does not decode to UTF-8 text)." : "Could not encode this text."); }
  };

  return (
    <div className="tool">
      <label className="tool-label" htmlFor="b64-in">Text or Base64</label>
      <textarea id="b64-in" className="tool-text" rows={7} spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="row tool-actions">
        <button className="btn primary" onClick={() => run("enc")}>Encode →</button>
        <button className="btn primary" onClick={() => run("dec")}>← Decode</button>
        <label className="check"><input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} /> URL-safe (- _ , no padding)</label>
        <button className="btn" onClick={() => { setInput(output); setOutput(""); }} disabled={!output}>Use result as input</button>
      </div>
      {error && <p className="tool-err" role="status">{error}</p>}
      {output && (
        <>
          <div className="row"><span className="tool-label">Result</span><span className="spacer" />
            <button className="btn small" onClick={() => navigator.clipboard.writeText(output)}>Copy</button></div>
          <textarea className="tool-text mono" rows={7} readOnly value={output} />
        </>
      )}
    </div>
  );
}
