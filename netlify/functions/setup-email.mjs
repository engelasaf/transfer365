// netlify/functions/setup-email.mjs — DELETE after use
export default async req => {
  const u=new URL(req.url);
  const p=u.searchParams.get("p"), r=u.searchParams.get("r");
  if(!p||!r) return new Response("Usage: ?p=PAT&r=RESEND_KEY",{status:400});

  const BASE = "https://api.supabase.com/v1/projects/hivyothlbntxcbsilktp/config/auth";
  const HEADERS = {"Authorization":`Bearer ${p}`,"Content-Type":"application/json"};

  // Step 1: Fix redirect URLs
  const r1 = await fetch(BASE, {
    method:"PATCH", headers:HEADERS,
    body:JSON.stringify({
      site_url: "https://transfer365.net",
      uri_allow_list: "https://transfer365.net,https://transfer365.net/app,https://www.transfer365.net,https://www.transfer365.net/app,http://localhost:3000",
    })
  });
  const d1 = await r1.json();
  if(!r1.ok) return new Response("Step1 failed: "+JSON.stringify(d1),{status:r1.status});

  // Step 2: Verify SMTP still intact
  const r2 = await fetch(BASE, { headers:HEADERS });
  const d2 = await r2.json();

  return new Response(
    `<html><body style="font:16px sans-serif;padding:40px;max-width:540px;margin:auto">
    <h1 style="color:#22C55E">&#x2705; URL Configuration Fixed!</h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr style="background:#F3F4F6"><td style="padding:9px;font-weight:700">Site URL</td><td style="padding:9px">${d2.site_url}</td></tr>
      <tr><td style="padding:9px;font-weight:700">Redirect URLs</td><td style="padding:9px">${d2.uri_allow_list||"(set)"}</td></tr>
      <tr style="background:#F3F4F6"><td style="padding:9px;font-weight:700">SMTP</td><td style="padding:9px">${d2.smtp_host}</td></tr>
      <tr><td style="padding:9px;font-weight:700">Sender</td><td style="padding:9px">${d2.smtp_sender_name}</td></tr>
    </table>
    <p style="background:#D1FAE5;padding:14px;border-radius:8px;color:#065F46">
      &#x2705; Now send a new verification email — the link will redirect to <b>transfer365.net/app</b>
    </p>
    <p style="color:#9CA3AF;margin-top:16px;font-size:13px">Delete setup-email.mjs from GitHub</p>
    </body></html>`,
    {headers:{"Content-Type":"text/html;charset=utf-8"}}
  );
};
export const config={path:"/.netlify/functions/setup-email"};
