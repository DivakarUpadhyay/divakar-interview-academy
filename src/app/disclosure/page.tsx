import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({ title: "Affiliate & Advertising Disclosure", description: "How DevLadder earns money from ads and affiliate links while keeping every lesson free.", path: "/disclosure" });

export default function DisclosurePage() {
  return (
    <div className="policy">
      <h1>Affiliate &amp; Advertising Disclosure</h1>
      <p>DevLadder is free. To pay for hosting and keep writing lessons, the site earns money in two ways:</p>
      <ul>
        <li><b>Advertising.</b> Ads are served by Google AdSense and are marked &quot;Advertisement&quot;. We do not choose individual ads.</li>
        <li>
          <b>Affiliate links.</b> Some links to books, courses, hosting or tools are affiliate links, marked &quot;affiliate&quot;. If
          you buy through one, we may earn a commission at no extra cost to you.
        </li>
      </ul>
      <p>
        We only recommend things we think are useful for learning. Earning a commission never changes what a lesson teaches. Read
        more in the <Link href="/privacy">privacy policy</Link>.
      </p>
    </div>
  );
}
