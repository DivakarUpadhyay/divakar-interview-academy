import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import GuidGenerator from "./GuidGenerator";

const t = tool("guid-generator");
export const metadata: Metadata = pageMeta({ title: `${t.name}: Free Online UUID v4`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Choose how many GUIDs you need (up to 1,000) and click <b>Generate</b>.</li>
          <li>Pick the format: uppercase for SQL Server style, <code>{"{braces}"}</code> for registry and COM, or no hyphens for compact IDs.</li>
          <li>Click <b>Copy all</b> to paste them into code, test data or a database script.</li>
        </ol>
        <h3>Creating GUIDs in code</h3>
        <pre><code>{`// C#
Guid id = Guid.NewGuid();            // random (v4)
Guid v7 = Guid.CreateVersion7();     // time-ordered, .NET 9+

-- SQL Server
SELECT NEWID();                      -- random
-- column default for index-friendly keys:
-- Id UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()`}</code></pre>
      </>}
      faq={[
        ["What is the difference between a GUID and a UUID?", "They are the same 128-bit identifier. GUID is Microsoft's name for it; UUID is the name used in the RFC standard and most other platforms."],
        ["Are these GUIDs unique and random?", "Yes. They are version 4 UUIDs made from your browser's cryptographic random number generator, so the chance of two ever colliding is negligible."],
        ["Should I use GUIDs as primary keys in SQL Server?", "They work, but random GUIDs fragment a clustered index. Use NEWSEQUENTIALID() or time-ordered version 7 GUIDs, or keep an INT/BIGINT clustered key and store the GUID as a separate column."],
        ["Are the GUIDs stored or logged?", "No. They are generated in your browser and never sent anywhere."],
      ]}>
      <GuidGenerator />
    </ToolPage>
  );
}
