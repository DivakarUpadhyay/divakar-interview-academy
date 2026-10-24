import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import DemoKit from "./DemoKit";

export const metadata: Metadata = pageMeta({ title: "Demo Kit — Live Coding & SQL Playground", description: "Run JavaScript and SQL live in your browser to practise interview coding tasks and demonstrate queries without installing anything.", path: "/demo" });

export default function DemoPage() {
  return (
    <>
      <h1>Demo kit</h1>
      <p className="muted">
        Tools to use during an interview or a screen-share round: run JavaScript live, run SQL against a sample HR/sales
        database in your browser, open ready-to-explain code demos, and keep your self-introduction and project pitch in one place.
      </p>
      <DemoKit />
    </>
  );
}
