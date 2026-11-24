import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import TimestampTool from "./TimestampTool";

const t = tool("unix-timestamp-converter");
export const metadata: Metadata = pageMeta({ title: `${t.name}: Epoch to Date and Back`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Paste a timestamp in the first box. Seconds (10 digits) and milliseconds (13 digits) are detected automatically.</li>
          <li>Or pick a date and time in the second box (your time zone) to get its timestamp.</li>
        </ol>
        <p>A Unix timestamp counts seconds since 1 January 1970 00:00:00 UTC. It has no time zone, which is why APIs, JWTs (<code>iat</code>, <code>exp</code>) and logs use it.</p>
        <h3>C#</h3>
        <pre><code>{`long seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
DateTimeOffset when = DateTimeOffset.FromUnixTimeSeconds(1764000000);
DateTime local = when.LocalDateTime;`}</code></pre>
        <h3>SQL Server</h3>
        <pre><code>{`-- timestamp → datetime (UTC)
SELECT DATEADD(SECOND, 1764000000, '1970-01-01');
-- datetime → timestamp (SQL Server 2016+, use DATEDIFF_BIG for milliseconds)
SELECT DATEDIFF(SECOND, '1970-01-01', SYSUTCDATETIME());`}</code></pre>
        <h3>JavaScript</h3>
        <pre><code>{`Math.floor(Date.now() / 1000);       // now, in seconds
new Date(1764000000 * 1000).toISOString();`}</code></pre>
      </>}
      faq={[
        ["Seconds or milliseconds?", "Unix tools, JWTs and most APIs use seconds (10 digits today). JavaScript's Date.now() and Java use milliseconds (13 digits). This tool detects which by length."],
        ["What is the year 2038 problem?", "A signed 32-bit integer runs out of seconds on 19 January 2038. Store timestamps as 64-bit values (long in C#, bigint in SQL Server) to avoid it."],
        ["Does a Unix timestamp include a time zone?", "No. It always counts from UTC; time zones only matter when you display it."],
        ["Is anything uploaded?", "No. All conversions run in your browser."],
      ]}>
      <TimestampTool />
    </ToolPage>
  );
}
