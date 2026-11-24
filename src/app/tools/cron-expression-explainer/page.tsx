import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import CronTool from "./CronTool";

const t = tool("cron-expression-explainer");
export const metadata: Metadata = pageMeta({ title: `${t.name}: Plain English and Next Run Times`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Type or paste a cron expression. The plain-English meaning and the next five run times update as you type.</li>
          <li>Five fields are standard Linux cron. Six fields mean the first one is seconds (Hangfire, Quartz-style, the Cronos library).</li>
          <li>Tick <b>UTC</b> to see run times the way most servers and GitHub Actions read them.</li>
        </ol>
        <h3>Cheat sheet</h3>
        <ul>
          <li><code>*</code> any value, <code>,</code> a list (<code>1,15</code>), <code>-</code> a range (<code>9-17</code>), <code>/</code> a step (<code>*/5</code>).</li>
          <li><code>@hourly</code>, <code>@daily</code>, <code>@weekly</code>, <code>@monthly</code> and <code>@yearly</code> are shortcuts.</li>
          <li>When both day-of-month and day-of-week are set, the job runs when <i>either</i> matches.</li>
        </ul>
        <h3>Using it in .NET</h3>
        <pre><code>{`// Hangfire: every weekday at 09:00 in Taipei time
RecurringJob.AddOrUpdate<ReportJob>("daily-report", j => j.RunAsync(),
    "0 9 * * 1-5", new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Taipei Standard Time") });

// Cronos: next occurrence in a BackgroundService
var cron = CronExpression.Parse("*/5 * * * *");
DateTime? next = cron.GetNextOccurrence(DateTime.UtcNow);`}</code></pre>
      </>}
      faq={[
        ["What time zone does cron use?", "Linux cron uses the server's time zone. GitHub Actions and most cloud schedulers use UTC. Hangfire uses UTC unless you pass a TimeZone."],
        ["What does ? mean?", "Quartz uses ? in day-of-month or day-of-week to say \"no specific value\". This tool treats it like *."],
        ["Does Quartz.NET work the same way?", "Mostly. Quartz expressions start with seconds and number days of week 1-7 starting on Sunday, so check day-of-week values when copying between Quartz and Linux cron."],
        ["Is my expression sent anywhere?", "No. Parsing and the next run times are calculated in your browser."],
      ]}>
      <CronTool />
    </ToolPage>
  );
}
