// ONE-TIME SETUP — receives credentials via query params, DELETE after use
export default async req => {
  const u   = new URL(req.url);
  const PAT = u.searchParams.get("p");   // Supabase PAT
  const RK  = u.searchParams.get("r");   // Resend key

  if (!PAT || !RK)
    return new Response("Usage: ?p=SUPABASE_PAT&r=RESEND_KEY", {status: 400});

  const REF = "hivyothlbntxcbsilktp";

  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: "PATCH",
    headers: {"Authorization": `Bearer ${PAT}`, "Content-Type": "application/json"},
    body: JSON.stringify({
      smtp_host:        "smtp.resend.com",
      smtp_port:        465,
      smtp_user:        "resend",
      smtp_pass:        RK,
      smtp_admin_email: "noreply@transfer365.net",
      smtp_sender_name: "Transfer365",
      mailer_sender_name: "Transfer365",
      mailer_subjects_confirmation: "Transfer365 \u2014 \u05d0\u05de\u05ea \u05d0\u05ea \u05db\u05ea\u05d5\u05d1\u05ea \u05d4\u05d0\u05d9\u05de\u05d9\u05dc \u05e9\u05dc\u05da",
      mailer_subjects_recovery:     "Transfer365 \u2014 \u05d0\u05d9\u05e4\u05d5\u05e1 \u05e1\u05d9\u05e1\u05de\u05d0",
      mailer_subjects_magic_link:   "Transfer365 \u2014 \u05e7\u05d9\u05e9\u05d5\u05e8 \u05db\u05e0\u05d9\u05e1\u05d4",
    })
  });

  const data = await res.json();

  if (!res.ok)
    return new Response(JSON.stringify(data, null, 2),
      {status: res.status, headers: {"Content-Type": "application/json"}});

  return new Response(
    `<html dir=rtl><body style="font:17px sans-serif;padding:48px 40px;max-width:520px;margin:auto;direction:rtl;background:#F9FAFB">
    <div style="background:#fff;padding:32px;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <h1 style="color:#16A34A;margin-top:0">&#x2705; Transfer365 Email Ready!</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="background:#F3F4F6"><td style="padding:9px 12px;font-weight:700;width:120px">Sender</td><td style="padding:9px 12px">${data.smtp_sender_name}</td></tr>
        <tr><td style="padding:9px 12px;font-weight:700">SMTP</td><td style="padding:9px 12px">${data.smtp_host}:${data.smtp_port}</td></tr>
        <tr style="background:#F3F4F6"><td style="padding:9px 12px;font-weight:700">&#x05d0;&#x05d9;&#x05de;&#x05d5;&#x05ea;</td><td style="padding:9px 12px">${data.mailer_subjects_confirmation}</td></tr>
        <tr><td style="padding:9px 12px;font-weight:700">&#x05d0;&#x05d9;&#x05e4;&#x05d5;&#x05e1;</td><td style="padding:9px 12px">${data.mailer_subjects_recovery}</td></tr>
      </table>
      <p style="color:#6B7280;margin-bottom:0;margin-top:20px;font-size:13px">
        &#x05e2;&#x05db;&#x05e9;&#x05d9;&#x05d5; &#x05de;&#x05d7;&#x05e7; <code>netlify/functions/setup-email.mjs</code> &#x05de;-GitHub
      </p>
    </div></body></html>`,
    {headers: {"Content-Type": "text/html;charset=utf-8"}}
  );
};
export const config = {path: "/.netlify/functions/setup-email"};
