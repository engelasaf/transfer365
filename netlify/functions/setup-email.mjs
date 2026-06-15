// netlify/functions/setup-email.mjs — DELETE after use
export default async req => {
  const u=new URL(req.url);
  const p=u.searchParams.get("p"), r=u.searchParams.get("r");
  if(!p||!r) return new Response("Usage: ?p=PAT&r=RESEND_KEY",{status:400});
  const res=await fetch("https://api.supabase.com/v1/projects/hivyothlbntxcbsilktp/config/auth",{
    method:"PATCH",
    headers:{"Authorization":`Bearer ${p}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      smtp_host:"smtp.resend.com",smtp_port:"465",smtp_user:"resend",smtp_pass:r,
      smtp_admin_email:"noreply@transfer365.net",smtp_sender_name:"Transfer365",
      mailer_sender_name:"Transfer365",
      mailer_subjects_confirmation:"Transfer365 — Verify your email address",
      mailer_templates_confirmation_content:"<!DOCTYPE html>\n<html lang=\"en\">\n<head><meta charset=\"UTF-8\"><style>\nbody{margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,'Segoe UI',Arial,sans-serif}\n.wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)}\n.header{background:#0D1F14;padding:32px 40px;text-align:center}\n.logo{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px}\n.logo span{color:#22C55E}\n.body{padding:40px;text-align:left}\n.greeting{font-size:22px;font-weight:700;color:#111827;margin-bottom:12px}\n.text{font-size:15px;color:#4B5563;line-height:1.7;margin-bottom:28px}\n.cta{display:block;width:fit-content;margin:0 auto 28px;padding:14px 36px;background:#22C55E;color:#052E0A;font-size:16px;font-weight:700;border-radius:10px;text-decoration:none}\n.divider{height:1px;background:#F3F4F6;margin:24px 0}\n.note{font-size:12px;color:#9CA3AF;line-height:1.6}\n.note a{color:#3C3489}\n.footer{background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB}\n.footer-logo{font-size:14px;font-weight:600;color:#3C3489;margin-bottom:6px}\n.footer-text{font-size:12px;color:#9CA3AF}\n</style></head>\n<body>\n<div class=\"wrap\">\n  <div class=\"header\"><div class=\"logo\">Transfer<span>365</span></div></div>\n  <div class=\"body\">\n    <div class=\"greeting\">Welcome to Transfer365 \u26a1</div>\n    <p class=\"text\">\n      Thanks for signing up! You're one step away from accessing real-time transfer intelligence used by agents in 34 countries.<br><br>\n      Click the button below to verify your email address and activate your account.\n    </p>\n    <a href=\"{{ .ConfirmationURL }}\" class=\"cta\">Verify my email \u2192</a>\n    <div class=\"divider\"></div>\n    <p class=\"note\">\n      If you didn't create a Transfer365 account, you can safely ignore this email.<br><br>\n      This link expires in 24 hours. Questions? <a href=\"mailto:support@transfer365.net\">support@transfer365.net</a>\n    </p>\n  </div>\n  <div class=\"footer\">\n    <div class=\"footer-logo\">Transfer365</div>\n    <div class=\"footer-text\">transfer365.net \u00b7 Intelligence for football agents<br>\u00a9 2026 Transfer365 Ltd \u00b7 London</div>\n  </div>\n</div>\n</body></html>",
      mailer_subjects_recovery:"Transfer365 — Reset your password",
      mailer_templates_recovery_content:"<!DOCTYPE html>\n<html lang=\"en\">\n<head><meta charset=\"UTF-8\"><style>\nbody{margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,'Segoe UI',Arial,sans-serif}\n.wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)}\n.header{background:#0D1F14;padding:32px 40px;text-align:center}\n.logo{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px}\n.logo span{color:#22C55E}\n.body{padding:40px;text-align:left}\n.greeting{font-size:22px;font-weight:700;color:#111827;margin-bottom:12px}\n.text{font-size:15px;color:#4B5563;line-height:1.7;margin-bottom:28px}\n.cta{display:block;width:fit-content;margin:0 auto 28px;padding:14px 36px;background:#3C3489;color:#fff;font-size:16px;font-weight:700;border-radius:10px;text-decoration:none}\n.divider{height:1px;background:#F3F4F6;margin:24px 0}\n.note{font-size:12px;color:#9CA3AF;line-height:1.6}\n.note a{color:#3C3489}\n.footer{background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB}\n.footer-logo{font-size:14px;font-weight:600;color:#3C3489;margin-bottom:6px}\n.footer-text{font-size:12px;color:#9CA3AF}\n</style></head>\n<body>\n<div class=\"wrap\">\n  <div class=\"header\"><div class=\"logo\">Transfer<span>365</span></div></div>\n  <div class=\"body\">\n    <div class=\"greeting\">Reset your password \ud83d\udd10</div>\n    <p class=\"text\">\n      We received a request to reset the password for your Transfer365 account.<br><br>\n      Click the button below to choose a new password.\n    </p>\n    <a href=\"{{ .ConfirmationURL }}\" class=\"cta\">Reset password \u2192</a>\n    <div class=\"divider\"></div>\n    <p class=\"note\">\n      If you didn't request a password reset, you can safely ignore this email \u2014 your account remains secure.<br><br>\n      Questions? <a href=\"mailto:support@transfer365.net\">support@transfer365.net</a>\n    </p>\n  </div>\n  <div class=\"footer\">\n    <div class=\"footer-logo\">Transfer365</div>\n    <div class=\"footer-text\">transfer365.net \u00b7 \u00a9 2026 Transfer365 Ltd \u00b7 London</div>\n  </div>\n</div>\n</body></html>",
      mailer_subjects_magic_link:"Transfer365 — Your sign-in link",
      mailer_subjects_invite:"You've been invited to Transfer365",
    })
  });
  const d=await res.json();
  if(!res.ok) return new Response(JSON.stringify(d,null,2),{status:res.status,headers:{"Content-Type":"application/json"}});
  return new Response(
    `<html><body style="font:16px sans-serif;padding:40px;max-width:500px;margin:auto">
    <h1 style="color:#22C55E">&#x2705; Email templates updated to English!</h1>
    <p><b>Sender:</b> ${d.smtp_sender_name}</p>
    <p><b>Confirm subject:</b> ${d.mailer_subjects_confirmation}</p>
    <p><b>Reset subject:</b> ${d.mailer_subjects_recovery}</p>
    <hr><p style="color:#9CA3AF">Delete setup-email.mjs from GitHub now.</p>
    </body></html>`,
    {headers:{"Content-Type":"text/html;charset=utf-8"}}
  );
};
export const config={path:"/.netlify/functions/setup-email"};
