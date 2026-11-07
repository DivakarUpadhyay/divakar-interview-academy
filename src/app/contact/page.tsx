import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { CONTACT_EMAIL, GITHUB_URL, OWNER } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Contact", description: "How to contact DevLadder about corrections, suggestions, privacy questions or partnerships.", path: "/contact" });

export default function ContactPage() {
  return (
    <div className="policy">
      <h1>Contact</h1>
      <p>Found a mistake, want a new course, or have a privacy or partnership question? Get in touch with {OWNER}:</p>
      <ul>
        {CONTACT_EMAIL && <li>Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>}
        <li>GitHub: <a href={GITHUB_URL} rel="noopener">{GITHUB_URL.replace("https://", "")}</a></li>
      </ul>
      <p className="muted">We usually reply within a few working days.</p>
    </div>
  );
}
