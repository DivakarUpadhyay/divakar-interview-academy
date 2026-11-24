import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import ConnStringTool from "./ConnStringTool";

const t = tool("sql-connection-string-builder");
export const metadata: Metadata = pageMeta({ title: `${t.name} for .NET, EF Core and Dapper`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Enter the server and database. For a named instance use <code>HOST\INSTANCE</code>; for a custom port use <code>HOST,1433</code> (a comma, not a colon).</li>
          <li>Pick how to log in: Windows (your account or the IIS app pool identity), a SQL Server login, or Microsoft Entra for Azure SQL.</li>
          <li>Copy the string or the ready <code>appsettings.json</code> block.</li>
        </ol>
        <p>Since Microsoft.Data.SqlClient 4.0 (EF Core 7 and later) <code>Encrypt</code> defaults to true. Local and development servers usually have a self-signed certificate, so keep <code>TrustServerCertificate=True</code> there, and use a real certificate with it turned off in production.</p>
        <h3>Use it in .NET</h3>
        <pre><code>{`// EF Core
builder.Services.AddDbContext<ShopDb>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Dapper
using var conn = new SqlConnection(config.GetConnectionString("Default"));
var orders = await conn.QueryAsync<Order>("SELECT * FROM dbo.Orders");`}</code></pre>
        <p>Keep passwords out of source control: use <code>dotnet user-secrets</code> in development and environment variables or Azure Key Vault in production.</p>
        <p>Connection failing? See <Link href="/errors/sql-server-network-related-or-instance-specific-error">network-related or instance-specific error</Link>, <Link href="/errors/sql-server-login-failed-for-user-18456">login failed (18456)</Link> and <Link href="/errors/sqlclient-certificate-chain-not-trusted">certificate chain not trusted</Link>.</p>
      </>}
      faq={[
        ["Server, Data Source or Address?", "They are synonyms. Server=, Data Source= and Address= all mean the same; Database= and Initial Catalog= are also the same."],
        ["Trusted_Connection or Integrated Security?", "Same thing. Both mean Windows authentication with the account the app runs as. Under IIS that is the app pool identity, not your own user."],
        ["When do I need MultipleActiveResultSets?", "Only when you read from two open data readers on one connection at the same time. EF Core rarely needs it; leaving it off is slightly faster."],
        ["Is my password sent anywhere?", "No. The string is built in your browser and nothing is uploaded."],
      ]}>
      <ConnStringTool />
    </ToolPage>
  );
}
