import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { POLICY_UPDATED } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Terms of Use", description: "The terms for using DevLadder tutorials, code samples and interview questions.", path: "/terms" });

export default function TermsPage() {
  return (
    <div className="policy">
      <h1>Terms of Use</h1>
      <p className="muted">Last updated: {POLICY_UPDATED}</p>
      <h2>Use of the content</h2>
      <p>
        You may read, print and use DevLadder lessons and code samples for your own learning and in your own projects. Please do
        not republish whole lessons or question banks on another site without permission.
      </p>
      <h2>No guarantee</h2>
      <p>
        We work to keep the content correct, but it is provided &quot;as is&quot; for learning. Always check official documentation
        before using code in production. We are not responsible for losses caused by using the content, and we cannot guarantee
        any interview or job result.
      </p>
      <h2>Links to other sites</h2>
      <p>
        Lessons link to official docs and other sites. We do not control them and are not responsible for their content. Some
        links may be affiliate links, explained in the <Link href="/disclosure">disclosure</Link>.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms. Continuing to use the site means you accept the current version.</p>
    </div>
  );
}
