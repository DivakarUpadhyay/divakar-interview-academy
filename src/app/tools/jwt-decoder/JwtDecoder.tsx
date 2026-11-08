"use client";
import { useMemo, useState } from "react";

// Sample token (not a real credential): {"alg":"HS256","typ":"JWT"} . {"sub":"1234","name":"Dev Ladder","role":"admin","iat":1767225600,"exp":1767229200}
const SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkRldiBMYWRkZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjcyMjU2MDAsImV4cCI6MTc2NzIyOTIwMH0.signature";

const part = (s: string) => {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
};
const TIME_CLAIMS: Record<string, string> = { iat: "Issued at", nbf: "Not valid before", exp: "Expires" };

export default function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE);
  const d = useMemo(() => {
    const parts = token.trim().replace(/^Bearer\s+/i, "").split(".");
    if (parts.length < 2) return { error: "A JWT has three parts separated by dots: header.payload.signature." };
    try { return { header: part(parts[0]), payload: part(parts[1]), hasSig: !!parts[2] }; }
    catch { return { error: "This does not look like a valid JWT, the header or payload is not Base64URL-encoded JSON." }; }
  }, [token]);

  const now = Date.now() / 1000;
  return (
    <div className="tool">
      <label className="tool-label" htmlFor="jwt-in">Paste a JWT (with or without &quot;Bearer &quot;)</label>
      <textarea id="jwt-in" className="tool-text mono" rows={5} spellCheck={false} value={token} onChange={(e) => setToken(e.target.value)} />
      {"error" in d ? <p className="tool-err" role="status">{d.error}</p> : (
        <>
          {typeof d.payload.exp === "number" && (
            <p className={d.payload.exp < now ? "tool-err" : "tool-ok"} role="status">
              {d.payload.exp < now ? "This token has expired." : "This token has not expired yet."}
            </p>
          )}
          <div className="tool-cols">
            <div><p className="tool-label">Header</p><pre className="tool-pre">{JSON.stringify(d.header, null, 2)}</pre></div>
            <div><p className="tool-label">Payload (claims)</p><pre className="tool-pre">{JSON.stringify(d.payload, null, 2)}</pre></div>
          </div>
          {Object.keys(TIME_CLAIMS).some((k) => typeof d.payload[k] === "number") && (
            <ul className="tool-times">
              {Object.entries(TIME_CLAIMS).filter(([k]) => typeof d.payload[k] === "number").map(([k, label]) => (
                <li key={k}><b>{label}</b> (<code>{k}</code>): {new Date(d.payload[k] * 1000).toUTCString()}</li>
              ))}
            </ul>
          )}
          <p className="muted small">The signature is not verified here: that needs the secret or public key, which should never be pasted into a website.</p>
        </>
      )}
    </div>
  );
}
