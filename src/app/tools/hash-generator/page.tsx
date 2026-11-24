import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import HashTool from "./HashTool";

const t = tool("hash-generator");
export const metadata: Metadata = pageMeta({ title: `${t.name}: SHA-1, SHA-384, SHA-512 Online`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Type or paste text. SHA-1, SHA-256, SHA-384 and SHA-512 hashes update as you type.</li>
          <li>Choose hex (lowercase or uppercase) or Base64 output and copy the one you need.</li>
        </ol>
        <p>The text is encoded as UTF-8 before hashing, the same as <code>Encoding.UTF8.GetBytes</code> in C#, so results match .NET and Node.js. SQL Server&apos;s <code>HASHBYTES</code> gives the same result for plain ASCII <code>varchar</code> text; <code>nvarchar</code> is UTF-16, so its hash differs.</p>
        <h3>C#</h3>
        <pre><code>{`using System.Security.Cryptography;
using System.Text;

byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes("Hello, DevLadder!"));
string hex = Convert.ToHexStringLower(hash);   // .NET 9+; use Convert.ToHexString(hash).ToLower() before
string b64 = Convert.ToBase64String(hash);`}</code></pre>
        <h3>SQL Server</h3>
        <pre><code>{`SELECT CONVERT(varchar(64), HASHBYTES('SHA2_256', 'Hello, DevLadder!'), 2);  -- uppercase hex`}</code></pre>
      </>}
      faq={[
        ["Can I hash passwords with SHA-256?", "No. Plain SHA hashes are too fast, so leaked hashes can be cracked by brute force. Use PBKDF2 (ASP.NET Core Identity's PasswordHasher), bcrypt or Argon2 for passwords."],
        ["Can a hash be reversed?", "No. A hash is one-way. Sites that \"decrypt\" hashes only look them up in tables of common inputs."],
        ["Why no MD5?", "Browsers' built-in crypto doesn't offer MD5 because it is broken for security use. Use SHA-256 for checksums and integrity checks."],
        ["Is my text uploaded?", "No. Hashing uses your browser's Web Crypto API; nothing leaves your device."],
      ]}>
      <HashTool />
    </ToolPage>
  );
}
