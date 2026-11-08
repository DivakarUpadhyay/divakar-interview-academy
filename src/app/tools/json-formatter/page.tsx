import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import JsonFormatter from "./JsonFormatter";

const t = tool("json-formatter");
export const metadata: Metadata = pageMeta({ title: `${t.name} — Free Online`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<ol>
        <li>Paste JSON from an API response, a config file (<code>appsettings.json</code>) or a log line.</li>
        <li>Click <b>Format / Validate</b> to pretty-print it, or <b>Minify</b> to remove all whitespace.</li>
        <li>If the JSON is broken, you get the exact <b>line and column</b> of the problem — usually a missing comma, a trailing comma or single quotes.</li>
        <li>Tick <b>Sort keys</b> to order every object&apos;s keys alphabetically, which makes two JSON documents easy to compare.</li>
      </ol>}
      faq={[
        ["Is my JSON sent to a server?", "No. Formatting and validation run entirely in your browser with JavaScript's built-in JSON parser, so private data never leaves your computer."],
        ["Why is my JSON invalid?", "The most common causes are a trailing comma after the last item, single quotes instead of double quotes, unquoted keys, and comments — standard JSON allows none of these."],
        ["What is the difference between formatting and minifying?", "Formatting adds line breaks and indentation so people can read it; minifying removes all whitespace so the payload is as small as possible for APIs and storage."],
        ["How do I format JSON in C#?", "With System.Text.Json: JsonSerializer.Serialize(obj, new JsonSerializerOptions { WriteIndented = true }). With Newtonsoft.Json: JsonConvert.SerializeObject(obj, Formatting.Indented)."],
      ]}>
      <JsonFormatter />
    </ToolPage>
  );
}
