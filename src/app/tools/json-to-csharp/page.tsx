import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import JsonToCSharp from "./JsonToCSharp";

const t = tool("json-to-csharp");
export const metadata: Metadata = pageMeta({ title: `${t.name}: Classes or Records, Free Online`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Paste a JSON object (or an array of objects) on the left. The C# code updates as you type.</li>
          <li>Set the root class name, then choose classes or records and whether to add <code>[JsonPropertyName]</code> attributes.</li>
          <li>Copy the code into your project and deserialize with <code>System.Text.Json</code>.</li>
        </ol>
        <p>Types are guessed from the values: whole numbers become <code>int</code> (or <code>long</code> when too big), decimals <code>double</code>, ISO dates <code>DateTime</code>, GUID strings <code>Guid</code>, arrays <code>List&lt;T&gt;</code> and nested objects get their own class. When an array holds objects with different keys, all keys are merged and the ones that are sometimes missing become nullable.</p>
        <h3>Deserialize it in C#</h3>
        <pre><code>{`using System.Text.Json;

var order = JsonSerializer.Deserialize<Order>(json);

// Or straight from an API with HttpClient
var order = await http.GetFromJsonAsync<Order>("api/orders/1042");`}</code></pre>
        <p>For money, change <code>double</code> to <code>decimal</code> after generating; JSON has no separate decimal type, so the tool can&apos;t tell.</p>
      </>}
      faq={[
        ["Do I need [JsonPropertyName]?", "Not when the JSON uses camelCase: ASP.NET Core and JsonSerializerDefaults.Web match camelCase to PascalCase automatically. Plain JsonSerializer.Deserialize is case-sensitive by default, so keep the attributes or pass PropertyNameCaseInsensitive = true."],
        ["Classes or records?", "Records are short and immutable, which suits DTOs and API responses. Classes with get; set; suit EF Core entities and objects you change after loading."],
        ["Why is a property typed object?", "Its value was null in every sample, so the type is unknown. Add a sample with a real value or set the type yourself."],
        ["Is my JSON uploaded?", "No. The conversion runs in your browser; nothing is sent to a server."],
      ]}>
      <JsonToCSharp />
    </ToolPage>
  );
}
