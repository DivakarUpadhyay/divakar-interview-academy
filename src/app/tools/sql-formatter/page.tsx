import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import SqlFormatter from "./SqlFormatter";

const t = tool("sql-formatter");
export const metadata: Metadata = pageMeta({ title: `${t.name} — Free Online T-SQL Beautifier`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<ol>
        <li>Paste a query copied from code, a log, SQL Profiler or Extended Events — even if it is all on one line.</li>
        <li>Click <b>Format SQL</b>. Each clause (<code>SELECT</code>, <code>FROM</code>, <code>WHERE</code>, <code>GROUP BY</code>…) starts on its own line, joins and their <code>ON</code> conditions are indented, and every selected column gets its own line.</li>
        <li>Choose UPPERCASE or lowercase keywords and the indent size to match your team&apos;s style, then <b>Copy</b>.</li>
        <li>Strings, <code>[bracketed]</code> names and comments are never changed. Learn T-SQL step by step in the free <Link href="/courses/sqlserver">SQL Server course</Link>.</li>
      </ol>}
      faq={[
        ["Does this work for SQL Server (T-SQL)?", "Yes. It understands T-SQL features such as TOP, WITH (NOLOCK), CROSS APPLY, OUTPUT, [bracketed] identifiers and @variables, and it also works for MySQL and PostgreSQL queries."],
        ["Is my query uploaded anywhere?", "No. The formatter runs in your browser, so queries that contain table names or data stay on your computer."],
        ["Does formatting change what the query does?", "No. Only whitespace and keyword case change. String literals, identifiers and comments are left exactly as they were."],
        ["Why format SQL at all?", "Readable SQL is easier to review and debug: you can see which columns are selected, how tables are joined and which filters apply at a glance."],
      ]}>
      <SqlFormatter />
    </ToolPage>
  );
}
