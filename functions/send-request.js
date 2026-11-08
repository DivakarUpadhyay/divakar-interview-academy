// Cloudflare Pages Function: POST /send-request
// Receives the request forms on /mentoring, /interview-prep-pack, /hire and /advertise and emails them to the owner
// through Resend (Pages secret RESEND_API_KEY), with Reply-To set to the visitor so a reply goes straight to them.
const TO = "divakaru1991@gmail.com";
const TOPICS = new Set([
  "Mock .NET interview", "CV and LinkedIn review", "Career and salary call",
  "Interview Prep Pack", "Project or job enquiry", "Sponsorship",
]);

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]{1,255}\.[a-z]{2,}$/i;

export async function onRequestPost({ request, env }) {
  let f;
  try { f = await request.json(); } catch { return json({ error: "Please send the form again." }, 400); }
  const name = String(f.name ?? "").trim().slice(0, 100);
  const email = String(f.email ?? "").trim().slice(0, 200);
  const topic = String(f.topic ?? "").trim();
  const message = String(f.message ?? "").trim().slice(0, 4000);
  const page = String(f.page ?? "").slice(0, 100);

  // Spam guards: a hidden field real people never fill, and forms submitted faster than a human can type.
  if (f.website || (Number(f.elapsedMs) > 0 && Number(f.elapsedMs) < 2500)) return json({ ok: true });
  if (!name || !EMAIL_RE.test(email) || !TOPICS.has(topic)) return json({ error: "Please fill in your name, a valid email and a topic." }, 400);
  if (!env.RESEND_API_KEY) return json({ error: "The form is not configured yet. Please email " + TO + " directly." }, 503);

  const country = request.headers.get("cf-ipcountry") || "?";
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#161a23">
    <h2 style="color:#1e3a6e;margin:0 0 12px">New request: ${esc(topic)}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td style="color:#5b6475">Name</td><td><b>${esc(name)}</b></td></tr>
      <tr><td style="color:#5b6475">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="color:#5b6475">From page</td><td>${esc(page)} · country ${esc(country)}</td></tr>
    </table>
    <p style="white-space:pre-wrap;background:#f6f7fb;border-radius:8px;padding:12px">${esc(message || "(no message)")}</p>
    <p style="color:#5b6475;font-size:13px">Reply to this email to answer ${esc(name)} directly.</p></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "DevLadder Requests <onboarding@resend.dev>", to: [TO], reply_to: email,
      subject: `DevLadder request: ${topic} from ${name}`,
      text: `${topic}\nName: ${name}\nEmail: ${email}\nPage: ${page} (${country})\n\n${message}`, html,
    }),
  });
  if (!res.ok) return json({ error: "Sorry, the request could not be sent. Please email " + TO + " directly." }, 502);
  return json({ ok: true });
}
