import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { POLICY_UPDATED } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Privacy Policy", description: "What data DevLadder stores, how cookies and Google advertising are used, and how to opt out.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <div className="policy">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: {POLICY_UPDATED}</p>

      <h2>What we collect</h2>
      <p>
        DevLadder has no user accounts and does not ask for your name, email or payment details. Your progress, notebook,
        bookmarks and theme are saved only in your own browser (local storage). Clearing your browser data removes them.
      </p>

      <h2>Analytics</h2>
      <p>
        We may use Google Tag Manager and Google Analytics to count visits and see which pages are useful. These tools use cookies
        and collect information such as pages viewed, device type, approximate location and referring site. This data is
        aggregated and is not used to identify you personally.
      </p>

      <h2>Advertising</h2>
      <p>
        We may show ads served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your
        prior visits to this and other websites. Google&apos;s use of advertising cookies enables it and its partners to serve
        ads to you based on your visits to this site and/or other sites on the internet.
      </p>
      <ul>
        <li>You can opt out of personalised advertising in <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>.</li>
        <li>You can opt out of some third-party vendors&apos; use of cookies at <a href="https://www.aboutads.info/choices" rel="noopener">aboutads.info</a>.</li>
        <li>Read <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses data from partner sites</a>.</li>
      </ul>
      <p>Visitors in the EEA, UK and Switzerland are shown a consent message before personalised ads or cookies are used.</p>

      <h2>Affiliate links</h2>
      <p>
        Some links to books, courses or tools may be affiliate links. The seller may set a cookie to record that you came from
        DevLadder. See the <Link href="/disclosure">disclosure</Link>.
      </p>

      <h2>Children</h2>
      <p>DevLadder is meant for students and professionals and is not directed at children under 13.</p>

      <h2>Changes and contact</h2>
      <p>We will update this page if anything changes. Questions: see the <Link href="/contact">contact page</Link>.</p>
    </div>
  );
}
