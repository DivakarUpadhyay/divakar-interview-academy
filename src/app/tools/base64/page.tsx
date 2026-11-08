import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import Base64Tool from "./Base64Tool";

const t = tool("base64");
export const metadata: Metadata = pageMeta({ title: `${t.name} — Free Online, UTF-8 Safe`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Paste plain text and click <b>Encode</b>, or paste Base64 and click <b>Decode</b>.</li>
          <li>Tick <b>URL-safe</b> for values used in URLs, file names or JWTs (it uses <code>-</code> and <code>_</code> and drops the <code>=</code> padding).</li>
          <li>Text in any language and emoji are handled correctly because the tool encodes UTF-8 bytes.</li>
        </ol>
        <h3>Base64 in C#</h3>
        <pre><code>{`string b64  = Convert.ToBase64String(Encoding.UTF8.GetBytes("Hello"));
string text = Encoding.UTF8.GetString(Convert.FromBase64String(b64));
// URL-safe (.NET 9+): System.Buffers.Text.Base64Url.EncodeToString(bytes)`}</code></pre>
      </>}
      faq={[
        ["Is Base64 encryption?", "No. Base64 only changes how bytes are written so they can travel as text. Anyone can decode it, so never use it to protect passwords or secrets."],
        ["Why does Base64 end with = or ==?", "Base64 encodes 3 bytes as 4 characters. When the input length is not a multiple of 3, = padding fills the last group."],
        ["What is URL-safe Base64?", "A variant that replaces + with - and / with _ and usually removes the padding, so the value can be used in URLs and file names without escaping."],
        ["Is my text uploaded?", "No. Encoding and decoding happen in your browser."],
      ]}>
      <Base64Tool />
    </ToolPage>
  );
}
