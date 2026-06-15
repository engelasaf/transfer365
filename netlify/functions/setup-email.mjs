// v3 — uses process.env (standard Node.js)
export default async req => {
  const u = new URL(req.url);
  if (u.searchParams.get("run") !== "yes")
    return new Response("Add ?run=yes", {status: 400});

  // Debug: show available env keys (redacted)
  const envKeys = Object.keys(process.env)
    .filter(k => k.includes("SUPA") || k.includes("RESEND") || k.includes("NETLIFY"))
    .join(", ");

  const PAT = process.env.SUPABASE_PAT;
  const RK  = process.env.RESEND_KEY;

  if (!PAT || !RK) {
    return new Response(
      JSON.stringify({error:"Missing env vars", found: envKeys || "none matching", total: Object.keys(process.env).length}),
      {status: 500, headers: {"Content-Type": "application/json"}}
    );
  }

  const REF = "hivyothlbntxcbsilktp";
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: "PATCH",
    headers: {"Authorization": `Bearer ${PAT}`, "Content-Type": "application/json"},
    body: JSON.stringify({
      smtp_host: "smtp.resend.com", smtp_port: 465,
      smtp_user: "resend", smtp_pass: RK,
      smtp_admin_email: "noreply@transfer365.net",
      smtp_sender_name: "Transfer365",
      mailer_sender_name: "Transfer365",
      mailer_subjects_confirmation: "Transfer365 \u2014 \u05d0\u05de\u05ea \u05d0\u05ea \u05db\u05ea\u05d5\u05d1\u05ea \u05d4\u05d0\u05d9\u05de\u05d9\u05d9\u05dc \u05e9\u05dc\u05da",
      mailer_subjects_recovery: "Transfer365 \u2014 \u05d0\u05d9\u05e4\u05d5\u05e1 \u05e1\u05d9\u05e1\u05de\u05d0",
      mailer_subjects_magic_link: "Transfer365 \u2014 \u05e7\u05d9\u05e9\u05d5\u05e8 \u05db\u05e0\u05d9\u05e1\u05d4",
    })
  });

  const data = await res.json();
  if (!res.ok) return new Response(JSON.stringify(data, null, 2), {status: res.status, headers: {"Content-Type": "application/json"}});

  return new Response(
    `<html dir=rtl><body style="font:16px sans-serif;padding:40px;max-width:500px;margin:auto;direction:rtl">
    <h1 style="color:#22C55E">&#x2705; &#x05de;&#x05d9;&#x05d9;&#x05dc; Transfer365 &#x05de;&#x05d5;&#x05db;&#x05df;!</h1>
    <p>Sender: <b>${data.smtp_sender_name}</b></p>
    <p>SMTP: <b>${data.smtp_host}:${data.smtp_port}</b></p>
    <p>&#x05e0;&#x05d5;&#x05e9;&#x05d0; &#x05d0;&#x05d9;&#x05de;&#x05d5;&#x05ea;: <b>${data.mailer_subjects_confirmation}</b></p>
    <hr><p style="color:#9CA3AF">&#x05de;&#x05d7;&#x05e7; setup-email.mjs &#x05de;-GitHub</p>
    </body></html>`,
    {headers: {"Content-Type": "text/html;charset=utf-8"}}
  );
};
export const config = {path: "/.netlify/functions/setup-email"};
