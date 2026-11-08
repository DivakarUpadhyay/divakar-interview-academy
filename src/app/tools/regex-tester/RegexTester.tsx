"use client";
import { useMemo, useState } from "react";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function RegexTester() {
  const [pattern, setPattern] = useState(String.raw`(\w+)@(\w+)\.com`);
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Contact sales@devladder.com or support@example.com, not admin@site.org.");
  const [replace, setReplace] = useState("$1 at $2");

  const result = useMemo(() => {
    if (!pattern) return { error: "", matches: [] as RegExpMatchArray[], html: esc(text), replaced: text };
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const matches = [...text.matchAll(re)].slice(0, 500);
      let html = "", last = 0;
      for (const m of matches) {
        if (m[0] === "") continue;
        html += esc(text.slice(last, m.index)) + `<mark>${esc(m[0])}</mark>`;
        last = (m.index ?? 0) + m[0].length;
      }
      html += esc(text.slice(last));
      return { error: "", matches, html, replaced: text.replace(new RegExp(pattern, flags), replace) };
    } catch (e) {
      return { error: (e as Error).message, matches: [], html: esc(text), replaced: "" };
    }
  }, [pattern, flags, text, replace]);

  const toggle = (f: string) => setFlags((x) => (x.includes(f) ? x.replace(f, "") : x + f));

  return (
    <div className="tool">
      <label className="tool-label" htmlFor="re">Regular expression</label>
      <div className="row tool-regex">
        <span className="muted">/</span>
        <input id="re" className="tool-input mono" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} />
        <span className="muted">/{flags}</span>
      </div>
      <div className="row tool-actions">
        {[["g", "global"], ["i", "ignore case"], ["m", "multiline"], ["s", "dot matches newline"]].map(([f, label]) => (
          <label key={f} className="check"><input type="checkbox" checked={flags.includes(f)} onChange={() => toggle(f)} /> {f} <span className="muted small">({label})</span></label>
        ))}
      </div>
      {result.error && <p className="tool-err" role="status">{result.error}</p>}
      <label className="tool-label" htmlFor="re-text">Test text</label>
      <textarea id="re-text" className="tool-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      <p className="tool-label">{result.matches.length} match{result.matches.length === 1 ? "" : "es"}</p>
      <div className="tool-preview" dangerouslySetInnerHTML={{ __html: result.html || "&nbsp;" }} />
      {result.matches.length > 0 && (
        <div className="table-wrap"><table>
          <thead><tr><th>#</th><th>Match</th><th>Index</th>{result.matches[0].length > 1 && <th>Groups</th>}</tr></thead>
          <tbody>{result.matches.slice(0, 50).map((m, i) => (
            <tr key={i}><td>{i + 1}</td><td><code>{m[0]}</code></td><td>{m.index}</td>
              {m.length > 1 && <td>{m.slice(1).map((g, j) => <span key={j}><code>${j + 1}</code> {g ?? "-"} </span>)}</td>}</tr>
          ))}</tbody>
        </table></div>
      )}
      <label className="tool-label" htmlFor="re-rep">Replace with (use $1, $2 for groups)</label>
      <input id="re-rep" className="tool-input mono" value={replace} onChange={(e) => setReplace(e.target.value)} spellCheck={false} />
      {!result.error && <div className="tool-preview">{result.replaced}</div>}
    </div>
  );
}
