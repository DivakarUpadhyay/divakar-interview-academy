"use client";
import { useMemo, useState } from "react";
import { jsonToCSharp } from "./convert";

const SAMPLE = `{
  "id": 1042,
  "orderNumber": "SO-2026-1042",
  "createdAt": "2026-11-24T09:30:00Z",
  "customer": { "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301", "name": "Lin Mei", "email": "mei@example.com" },
  "items": [
    { "sku": "KB-01", "qty": 2, "price": 49.5 },
    { "sku": "MS-07", "qty": 1, "price": 19.99, "note": "gift wrap" }
  ],
  "paid": true,
  "coupon": null
}`;

export default function JsonToCSharp() {
  const [input, setInput] = useState(SAMPLE);
  const [root, setRoot] = useState("Order");
  const [records, setRecords] = useState(false);
  const [attributes, setAttributes] = useState(true);
  const [nullable, setNullable] = useState(true);

  const { code, error } = useMemo(() => {
    if (!input.trim()) return { code: "", error: "" };
    try { return { code: jsonToCSharp(input, { root: root.trim() || "Root", records, attributes, nullable }), error: "" }; }
    catch (e) { return { code: "", error: e instanceof Error ? e.message : "Invalid JSON" }; }
  }, [input, root, records, attributes, nullable]);

  return (
    <div className="tool">
      <div className="tool-cols">
        <div>
          <label className="tool-label" htmlFor="j2c-in">JSON</label>
          <textarea id="j2c-in" className="tool-text mono" rows={18} spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div>
          <div className="row"><span className="tool-label">C# code</span><span className="spacer" />
            <button className="btn small" onClick={() => navigator.clipboard.writeText(code)} disabled={!code}>Copy</button></div>
          {error ? <p className="tool-err" role="status">{error}</p> : <pre className="tool-pre" style={{ minHeight: "22em" }}>{code}</pre>}
        </div>
      </div>
      <div className="row tool-actions">
        <label className="check">Root class name <input className="tool-input" style={{ width: "10em" }} value={root} onChange={(e) => setRoot(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={records} onChange={(e) => setRecords(e.target.checked)} /> Records</label>
        <label className="check"><input type="checkbox" checked={attributes} onChange={(e) => setAttributes(e.target.checked)} /> [JsonPropertyName]</label>
        <label className="check"><input type="checkbox" checked={nullable} onChange={(e) => setNullable(e.target.checked)} /> Nullable reference types</label>
        <button className="btn" onClick={() => setInput("")}>Clear</button>
      </div>
    </div>
  );
}
