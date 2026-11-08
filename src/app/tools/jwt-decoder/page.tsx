import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "@/components/ToolPage";
import { pageMeta } from "@/lib/seo";
import { tool } from "@/lib/tools";
import JwtDecoder from "./JwtDecoder";

const t = tool("jwt-decoder");
export const metadata: Metadata = pageMeta({ title: `${t.name} — Free Online JSON Web Token Viewer`, description: t.description, path: `/tools/${t.slug}` });

export default function Page() {
  return (
    <ToolPage tool={t}
      howTo={<>
        <ol>
          <li>Paste a token from an <code>Authorization: Bearer …</code> header, a cookie or your browser&apos;s dev tools.</li>
          <li>The header (algorithm and type) and payload (claims such as <code>sub</code>, <code>role</code>, <code>aud</code>) appear instantly.</li>
          <li><code>iat</code>, <code>nbf</code> and <code>exp</code> are shown as readable dates, with a clear expired / not expired message.</li>
        </ol>
        <h3>Validating a JWT in ASP.NET Core</h3>
        <pre><code>{`builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new()
    {
        ValidateIssuer = true, ValidIssuer = "https://login.example.com",
        ValidateAudience = true, ValidAudience = "my-api",
        ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1),
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
    });`}</code></pre>
        <p>Learn authentication end to end in the free <Link href="/courses/aspnet-core-webapi">ASP.NET Core Web API course</Link>.</p>
      </>}
      faq={[
        ["Is it safe to paste a JWT here?", "The token is decoded only in your browser and never sent anywhere. Still, a live token is a credential — prefer test tokens, and never paste signing secrets or private keys into any website."],
        ["Is a JWT encrypted?", "A normal JWT (JWS) is only Base64URL-encoded and signed, so anyone can read the claims. The signature proves it was not changed; it does not hide the content."],
        ["Why is my token expired?", "The exp claim is a Unix time in seconds. When the current time passes it, APIs reject the token and the client should use a refresh token or sign in again."],
        ["Does this verify the signature?", "No. Verification needs the issuer's secret or public key; do it in your server code, as in the ASP.NET Core example above."],
      ]}>
      <JwtDecoder />
    </ToolPage>
  );
}
