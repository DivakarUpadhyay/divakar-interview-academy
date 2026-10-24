import { ImageResponse } from "next/og";

// Default share image (WhatsApp, LinkedIn, X, Slack previews) for every page without its own.
export const alt = "DevLadder — tutorials and interview questions from basics to advanced";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80,
        background: "linear-gradient(135deg, #1e3a6e 0%, #3b5bdb 100%)", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, background: "#fff", color: "#3b5bdb", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800 }}>DL</div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>DevLadder</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 40, lineHeight: 1.1 }}>Climb from basics to advanced.</div>
        <div style={{ fontSize: 30, marginTop: 28, opacity: 0.9 }}>
          C# · .NET internals · ASP.NET Core · SQL Server · System design · DSA · Azure · Angular · React
        </div>
      </div>
    ),
    size,
  );
}
