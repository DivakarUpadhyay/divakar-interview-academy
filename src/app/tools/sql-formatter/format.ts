// A small, dependency-free SQL formatter: uppercases keywords, starts each main clause on a new line, indents joins,
// AND/OR conditions and the column list, and leaves string literals, quoted identifiers and comments untouched.

const KEYWORDS = new Set(("select from where group by order having join inner left right full outer cross on and or not in is null " +
  "like between exists as distinct top limit offset fetch next rows only union all intersect except insert into values update set " +
  "delete merge using when matched then else end case create alter drop table view procedure function index with nolock " +
  "declare begin commit rollback transaction return if while asc desc over partition count sum avg min max cast convert " +
  "coalesce isnull primary key foreign references default identity nvarchar varchar int bigint bit datetime2 date decimal " +
  "output inserted deleted apply pivot unpivot exec execute go").split(" "));

// Clauses that start on their own line at the current depth.
const CLAUSES = ["union all", "group by", "order by", "partition by", "insert into", "left outer join", "right outer join",
  "full outer join", "inner join", "left join", "right join", "full join", "cross join", "cross apply", "outer apply",
  "select", "from", "where", "having", "values", "update", "set", "delete", "union", "intersect", "except", "join", "with", "merge", "using", "when"];
const JOINS = /join|apply/;

type Tok = { t: "word" | "str" | "comment" | "punct" | "space"; v: string };

function tokenize(sql: string): Tok[] {
  const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*'|"(?:""|[^"])*"|\[[^\]]*\])|([A-Za-z_@#][\w@#$.]*|\d+(?:\.\d+)?)|(\s+)|([\s\S])/g;
  const out: Tok[] = [];
  for (const m of sql.matchAll(re)) {
    if (m[1]) out.push({ t: "comment", v: m[1] });
    else if (m[2]) out.push({ t: "str", v: m[2] });
    else if (m[3]) out.push({ t: "word", v: m[3] });
    else if (m[4]) out.push({ t: "space", v: " " });
    else out.push({ t: "punct", v: m[5] });
  }
  return out;
}

export function formatSql(sql: string, opts: { upper: boolean; indent: string }): string {
  const toks = tokenize(sql.trim()).filter((t, i, a) => !(t.t === "space" && a[i - 1]?.t === "space"));
  const words = (i: number, n: number) => toks.slice(i).filter((t) => t.t !== "space").slice(0, n).map((t) => t.v.toLowerCase()).join(" ");
  let out = "";
  let depth = 0;
  let inSelect = false; // commas start new lines (SELECT column list, SET assignments)
  let inOn = false;     // inside a JOIN ... ON condition, so AND/OR line up under ON
  const nl = (extra = 0) => { out = out.trimEnd() + "\n" + opts.indent.repeat(Math.max(depth + extra, 0)); };

  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    if (tk.t === "space") { if (!out.endsWith(" ") && !out.endsWith("\n") && !/\s$/.test(out) && !out.endsWith("(")) out += " "; continue; }
    if (tk.t === "comment") { out += tk.v; if (tk.v.startsWith("--")) nl(); continue; }
    if (tk.t === "str") { out += tk.v; continue; }
    if (tk.t === "punct") {
      if (tk.v === "(") { out += "("; depth++; continue; }
      if (tk.v === ")") { depth--; out = out.trimEnd() + ")"; continue; }
      if (tk.v === ",") { out = out.trimEnd() + ","; if (inSelect && depth === 0) nl(1); else out += " "; continue; }
      if (tk.v === ";") { out = out.trimEnd() + ";\n"; inSelect = false; continue; }
      out += tk.v; continue;
    }
    // word
    let clause = CLAUSES.find((c) => words(i, c.split(" ").length) === c);
    // WITH only starts a CTE at the beginning of a statement; elsewhere it is a table hint like WITH (NOLOCK).
    if (clause === "with" && out.trim() && !out.trimEnd().endsWith(";")) clause = undefined;
    if (clause) {
      const n = clause.split(" ").length;
      let used = 0, j = i;
      for (; used < n; j++) if (toks[j].t !== "space") used++;
      const text = toks.slice(i, j).filter((t) => t.t !== "space").map((t) => (opts.upper ? t.v.toUpperCase() : t.v.toLowerCase())).join(" ");
      if (out.trim()) nl(JOINS.test(clause) || clause === "on" ? 1 : 0);
      out += text;
      inSelect = clause === "select" || clause === "set";
      inOn = false;
      if (clause === "select" || clause === "set" || clause === "values") nl(1); else out += " ";
      i = j - 1;
      continue;
    }
    const lower = tk.v.toLowerCase();
    if ((lower === "and" || lower === "or") && depth === 0) { nl(inOn ? 2 : 1); }
    if (lower === "on" && depth === 0) { nl(2); inOn = true; }
    out += KEYWORDS.has(lower) ? (opts.upper ? tk.v.toUpperCase() : lower) : tk.v;
  }
  return out.split("\n").map((l) => l.trimEnd()).join("\n").trim();
}
