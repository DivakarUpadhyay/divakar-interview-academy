"use client";
import { useEffect, useState } from "react";

// RFC 4122 version 4 GUID from the browser's cryptographic random generator.
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g,
  (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)));

export default function GuidGenerator() {
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [braces, setBraces] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [list, setList] = useState<string[]>([]);

  const make = () => setList(Array.from({ length: Math.min(Math.max(count, 1), 1000) }, uuid));
  useEffect(make, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shape = (g: string) => {
    let s = hyphens ? g : g.replace(/-/g, "");
    if (upper) s = s.toUpperCase();
    return braces ? `{${s}}` : s;
  };
  const text = list.map(shape).join("\n");

  return (
    <div className="tool">
      <div className="row tool-actions">
        <label className="check">How many{" "}
          <input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} style={{ width: 90 }} /></label>
        <label className="check"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase</label>
        <label className="check"><input type="checkbox" checked={braces} onChange={(e) => setBraces(e.target.checked)} /> {"{Braces}"}</label>
        <label className="check"><input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} /> Hyphens</label>
        <button className="btn primary" onClick={make}>Generate</button>
        <button className="btn" onClick={() => navigator.clipboard.writeText(text)}>Copy all</button>
      </div>
      <textarea className="tool-text mono" rows={Math.min(Math.max(list.length, 3), 16)} readOnly value={text} aria-label="Generated GUIDs" />
    </div>
  );
}
