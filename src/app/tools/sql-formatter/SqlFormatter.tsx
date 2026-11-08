"use client";
import { useState } from "react";
import { formatSql } from "./format";

const SAMPLE = "select c.Id, c.Name, count(o.Id) as Orders from dbo.Customers c with (nolock) left join dbo.Orders o on o.CustomerId = c.Id and o.Status = 'Paid' where c.Country = 'TW' and c.IsActive = 1 group by c.Id, c.Name order by Orders desc";

export default function SqlFormatter() {
  const [input, setInput] = useState(SAMPLE);
  const [upper, setUpper] = useState(true);
  const [indent, setIndent] = useState("    ");
  const [output, setOutput] = useState("");

  return (
    <div className="tool">
      <label className="tool-label" htmlFor="sql-in">Paste your SQL query</label>
      <textarea id="sql-in" className="tool-text" rows={8} spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="row tool-actions">
        <button className="btn primary" onClick={() => setOutput(formatSql(input, { upper, indent }))}>Format SQL</button>
        <label className="check"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> UPPERCASE keywords</label>
        <label className="check">Indent{" "}
          <select value={indent} onChange={(e) => setIndent(e.target.value)} aria-label="Indent">
            <option value="    ">4 spaces</option><option value="  ">2 spaces</option><option value={"\t"}>Tab</option>
          </select>
        </label>
        <button className="btn" onClick={() => { setInput(""); setOutput(""); }}>Clear</button>
      </div>
      {output && (
        <>
          <div className="row"><span className="tool-label">Formatted SQL</span><span className="spacer" />
            <button className="btn small" onClick={() => navigator.clipboard.writeText(output)}>Copy</button></div>
          <textarea className="tool-text" rows={16} readOnly spellCheck={false} value={output} />
        </>
      )}
    </div>
  );
}
