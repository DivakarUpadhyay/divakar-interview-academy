import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { CONTACT_EMAIL, OWNER } from "@/lib/site";
import RequestForm from "@/components/RequestForm";

export const metadata: Metadata = pageMeta({ title: "Contact", description: "Send DevLadder a message about a correction, a course you want, a privacy question or a partnership.", path: "/contact" });

const CONTACT_TOPICS = ["General question", "Correction or suggestion", "Request a new course", "Privacy question", "Partnership"];

export default function ContactPage() {
  return (
    <div className="policy">
      <h1>Contact</h1>
      <p>
        Found a mistake, want a course that isn&apos;t here yet, or have a privacy or partnership question? Fill in the form and your
        message comes straight to {OWNER}. You&apos;ll get a reply by email, usually within a day or two.
      </p>
      <RequestForm topics={CONTACT_TOPICS} cta="Send message" messageLabel="Your message"
        placeholder="e.g. The EF Core lesson on migrations has a typo in the second example." />
      <p className="muted small">Prefer email? Write to <b>{CONTACT_EMAIL}</b>.</p>
    </div>
  );
}
