"use client";
import { useEffect, useRef, useState } from "react";

/** Request form that emails the owner through /send-request (no mail app needed on the visitor's device). */
export default function RequestForm({ topics, cta = "Send request", messageLabel = "Message", placeholder = "" }: {
  topics: string[]; cta?: string; messageLabel?: string; placeholder?: string;
}) {
  const [topic, setTopic] = useState(topics[0]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const started = useRef(Date.now());

  // Buttons elsewhere on the page link to #request?topic=..., which preselects the topic and scrolls here.
  useEffect(() => {
    const pick = () => {
      const t = new URLSearchParams(location.hash.split("?")[1] ?? "").get("topic");
      if (t && topics.includes(t)) setTopic(t);
    };
    pick(); addEventListener("hashchange", pick);
    return () => removeEventListener("hashchange", pick);
  }, [topics]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending"); setError("");
    try {
      const res = await fetch("/send-request", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(f), topic, page: location.pathname, elapsedMs: Date.now() - started.current }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      setState("sent");
    } catch (err) { setError((err as Error).message); setState("error"); }
  };

  if (state === "sent") {
    return <div id="request" className="card request-form"><p className="tool-ok" role="status">Thanks! Your request was sent. You&apos;ll get a reply by email, usually within a day.</p></div>;
  }
  return (
    <form id="request" className="card request-form" onSubmit={submit}>
      {topics.length > 1 && (
        <label>What do you need?
          <select name="topicSelect" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      )}
      <label>Your name<input name="name" required maxLength={100} autoComplete="name" /></label>
      <label>Your email<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label>{messageLabel}<textarea name="message" rows={4} maxLength={4000} placeholder={placeholder} /></label>
      {/* Hidden from people; bots that fill every field get ignored. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <button className="btn primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : cta}</button>
      {state === "error" && <p className="tool-err" role="alert">{error}</p>}
    </form>
  );
}
