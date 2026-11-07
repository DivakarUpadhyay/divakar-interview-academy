"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

// Google AdSense. Nothing renders until NEXT_PUBLIC_ADSENSE_CLIENT is set (e.g. ca-pub-1234567890123456),
// so the site stays ad-free until the AdSense account is approved.
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSenseScript() {
  if (!CLIENT) return null;
  return (
    <Script
      id="adsense"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
    />
  );
}

/** One responsive display ad unit. `slot` is the ad unit ID from AdSense → Ads → By ad unit. */
export function AdSlot({ slot, className = "" }: { slot?: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    if (!CLIENT || !slot || !ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle ||= []).push({});
    } catch {}
  }, [slot]);
  if (!CLIENT || !slot) return null;
  return (
    <div className={`ad-box ${className}`}>
      <span className="ad-label">Advertisement</span>
      <ins ref={ref} className="adsbygoogle" style={{ display: "block" }} data-ad-client={CLIENT} data-ad-slot={slot}
        data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

