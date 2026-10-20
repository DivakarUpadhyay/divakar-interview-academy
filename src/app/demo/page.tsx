import type { Metadata } from "next";
import DemoKit from "./DemoKit";

export const metadata: Metadata = { title: "Demo kit — live coding & SQL playground" };

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
