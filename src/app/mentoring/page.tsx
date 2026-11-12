import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { BOOKING_URL, bookingHref, QUICK_OFFERS, SESSIONS } from "@/lib/earn";
import { OWNER } from "@/lib/site";
import RequestForm from "@/components/RequestForm";

export const metadata: Metadata = pageMeta({
  title: "Mock .NET Interviews and Career Mentoring",
  description: "Book a one-to-one mock .NET interview, a CV and LinkedIn review or a career call with an experienced full-stack .NET developer. Honest feedback you can act on.",
  path: "/mentoring",
});

export default function MentoringPage() {
  return (
    <div className="policy offer">
      <h1>Mock interviews and mentoring</h1>
      <p className="tool-lead">
        Reading answers is one thing. Saying them out loud to someone who asks follow-up questions is what gets you the job.
        I&apos;m {OWNER}, a full-stack .NET developer with nine years of experience, and I run practice interviews the way real
        companies do.
      </p>
      <h2>Quick turnaround services</h2>
      <p className="muted">Need help with an interview soon? Choose a focused service below. Checkout buttons appear when hosted payment links are configured.</p>
      <div className="offer-grid">
        {QUICK_OFFERS.map((offer) => (
          <div key={offer.name} className="card offer-card">
            <h2>{offer.name}</h2>
            <p className="offer-price">{offer.price}</p>
            <p>{offer.detail}</p>
            {offer.checkoutUrl ? (
              <a className="btn primary" href={offer.checkoutUrl} target="_blank" rel="noopener noreferrer">Pay &amp; get started</a>
            ) : (
              <a className="btn primary" href={`#request?topic=${encodeURIComponent(offer.topic)}`}>Request this service</a>
            )}
          </div>
        ))}
      </div>
      <div className="offer-grid">
        {SESSIONS.map((s) => (
          <div key={s.name} className="card offer-card">
            <h2>{s.name}</h2>
            <p className="offer-price">{s.price} <span className="muted small">· {s.minutes} minutes, online</span></p>
            <p>{s.detail}</p>
            <a className="btn primary" href={bookingHref(s.name)}>{BOOKING_URL ? "Book a time" : "Request a time"}</a>
          </div>
        ))}
      </div>
      <h2>How it works</h2>
      <ol>
        <li>Pick a session and {BOOKING_URL ? "choose a time that suits you" : "send the form below with two or three times that suit you and your time zone"}.</li>
        <li>Tell me the role you are aiming for and share the job description if you have one.</li>
        <li>We meet on Google Meet or Zoom. You get written notes afterwards.</li>
      </ol>
      {!BOOKING_URL && (<><h2>Request a service</h2>
        <RequestForm topics={[...new Set([...QUICK_OFFERS.map((o) => o.topic), ...SESSIONS.map((s) => s.name)])]} messageLabel="Times that suit you, your time zone and the role you are aiming for"
          placeholder="e.g. Weekdays after 7 pm Taipei time. Senior .NET developer role at a bank." /></>)}
      <p className="muted small">
        Preparing on your own first? Start with the <Link href="/interview-questions">interview questions by role</Link> and the
        timed <Link href="/practice">mock interview test</Link>.
      </p>
    </div>
  );
}
