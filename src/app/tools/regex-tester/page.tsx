import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import RegexTester from "./RegexTester";

const t = tool("regex-tester");
export const metadata: Metadata = pageMeta({ title: `${t.name}: Free Online Regular Expression Tester`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Type a pattern between the slashes, for example <code>{String.raw`\d{3}-\d{4}`}</code> for a phone number part.</li>
          <li>Paste the text to search. Every match is highlighted live, and the table lists each match&apos;s position and capture groups.</li>
          <li>Turn on flags: <b>i</b> ignores case, <b>m</b> makes <code>^</code> and <code>$</code> match each line, <b>s</b> lets <code>.</code> match new lines.</li>
          <li>Type a replacement using <code>$1</code>, <code>$2</code> to see the result of a find-and-replace.</li>
        </ol>
        <h3>Using the pattern in C# / .NET</h3>
        <p>
          The tester uses JavaScript&apos;s regex engine, which matches .NET for common syntax (character classes, quantifiers, groups,
          look-ahead). In C#, use a verbatim string so backslashes are not escaped twice:
        </p>
        <pre><code>{`var re = new Regex(@"(\\w+)@(\\w+)\\.com", RegexOptions.IgnoreCase);
foreach (Match m in re.Matches(text))
    Console.WriteLine($"{m.Groups[1].Value} at {m.Groups[2].Value}");`}</code></pre>
        <p>Named groups are written <code>{"(?<name>...)"}</code> in both engines. .NET-only features such as balancing groups are not supported here.</p>
      </>}
      faq={[
        ["Which regex flavour does this tester use?", "Your browser's JavaScript (ECMAScript) engine. Most everyday patterns behave the same in .NET, Java and Python; differences appear in advanced features such as look-behind limits and balancing groups."],
        ["Why does my pattern match nothing?", "Check that special characters like . ? + ( ) [ ] are escaped with a backslash when you mean them literally, and turn on the i flag if the case may differ."],
        ["Is my text uploaded?", "No. Matching runs in your browser, so log files or customer data stay on your computer."],
        ["How do I match a whole line?", "Use ^ and $ with the m (multiline) flag, for example ^ERROR.*$ to match every line that starts with ERROR."],
      ]}>
      <RegexTester />
    </ToolPage>
  );
}
