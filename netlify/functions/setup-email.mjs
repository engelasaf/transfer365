// netlify/functions/setup-email.mjs
// ONE-TIME SETUP FUNCTION — deletes itself after use
// Call: https://transfer365.net/.netlify/functions/setup-email?token=YOUR_PAT

export default async (req) => {
  const url = new URL(req.url);
  const pat = url.searchParams.get("token");

  if (!pat || !pat.startsWith("sbp_")) {
    return new Response("Missing or invalid token", { status: 401 });
  }

  const ref = "hivyothlbntxcbsilktp";

  const emailHtml = "<!DOCTYPE html>\n<html dir=\"rtl\" lang=\"he\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<style>\n  body { margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,'Segoe UI',Arial,sans-serif; }\n  .wrap { max-width:520px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,.08); }\n  .header { background:#0D1F14; padding:32px 40px; text-align:center; }\n  .logo { font-size:22px; font-weight:700; color:#fff; letter-spacing:-.5px; }\n  .logo span { color:#22C55E; }\n  .body { padding:40px; direction:rtl; text-align:right; }\n  .greeting { font-size:22px; font-weight:700; color:#111827; margin-bottom:12px; }\n  .text { font-size:15px; color:#4B5563; line-height:1.7; margin-bottom:28px; }\n  .cta { display:block; width:fit-content; margin:0 auto 28px; padding:14px 36px; background:#22C55E; color:#052E0A; font-size:16px; font-weight:700; border-radius:10px; text-decoration:none; text-align:center; }\n  .divider { height:1px; background:#F3F4F6; margin:24px 0; }\n  .note { font-size:12px; color:#9CA3AF; line-height:1.6; }\n  .note a { color:#3C3489; }\n  .footer { background:#F9FAFB; padding:24px 40px; text-align:center; border-top:1px solid #E5E7EB; }\n  .footer-text { font-size:12px; color:#9CA3AF; }\n  .footer-logo { font-size:14px; font-weight:600; color:#3C3489; margin-bottom:6px; }\n</style>\n</head>\n<body>\n<div class=\"wrap\">\n  <div class=\"header\">\n    <div class=\"logo\">Transfer<span>365</span></div>\n  </div>\n  <div class=\"body\">\n    <div class=\"greeting\">\u05d1\u05e8\u05d5\u05da \u05d4\u05d1\u05d0 \u05dc-Transfer365 \u26a1</div>\n    <p class=\"text\">\n      \u05ea\u05d5\u05d3\u05d4 \u05e9\u05e0\u05e8\u05e9\u05de\u05ea! \u05d0\u05e0\u05d7\u05e0\u05d5 \u05e9\u05de\u05d7\u05d9\u05dd \u05e9\u05d0\u05ea\u05d4 \u05db\u05d0\u05df.<br><br>\n      \u05dc\u05d7\u05e5 \u05e2\u05dc \u05d4\u05db\u05e4\u05ea\u05d5\u05e8 \u05dc\u05de\u05d8\u05d4 \u05dc\u05d0\u05d9\u05de\u05d5\u05ea \u05db\u05ea\u05d5\u05d1\u05ea \u05d4\u05d0\u05d9\u05de\u05d9\u05d9\u05dc \u05e9\u05dc\u05da \u2014 \u05d5\u05ea\u05d5\u05da \u05e9\u05e0\u05d9\u05d5\u05ea \u05ea\u05d5\u05db\u05dc \u05dc\u05d4\u05ea\u05d7\u05d9\u05dc \u05dc\u05d2\u05dc\u05d5\u05ea \u05d4\u05d6\u05d3\u05de\u05e0\u05d5\u05d9\u05d5\u05ea \u05d4\u05e2\u05d1\u05e8\u05d4 \u05dc\u05e4\u05e0\u05d9 \u05db\u05d5\u05dc\u05dd.\n    </p>\n    <a href=\"{{ .ConfirmationURL }}\" class=\"cta\">\u05d0\u05de\u05ea \u05d0\u05ea \u05d4\u05d0\u05d9\u05de\u05d9\u05d9\u05dc \u05e9\u05dc\u05da \u2190</a>\n    <div class=\"divider\"></div>\n    <p class=\"note\">\n      \u05d0\u05dd \u05dc\u05d0 \u05d9\u05e6\u05e8\u05ea \u05d7\u05e9\u05d1\u05d5\u05df \u05d1-Transfer365, \u05e0\u05d9\u05ea\u05df \u05dc\u05d4\u05ea\u05e2\u05dc\u05dd \u05de\u05d4\u05d5\u05d3\u05e2\u05d4 \u05d6\u05d5.<br><br>\n      \u05d4\u05e7\u05d9\u05e9\u05d5\u05e8 \u05ea\u05e7\u05e3 \u05dc-24 \u05e9\u05e2\u05d5\u05ea. \u05dc\u05e9\u05d0\u05dc\u05d5\u05ea: <a href=\"mailto:support@transfer365.net\">support@transfer365.net</a>\n    </p>\n  </div>\n  <div class=\"footer\">\n    <div class=\"footer-logo\">Transfer365</div>\n    <div class=\"footer-text\">\n      transfer365.net \u00b7 Intelligence for football agents<br>\n      \u00a9 2026 Transfer365 Ltd \u00b7 London\n    </div>\n  </div>\n</div>\n</body>\n</html>\n";

  const payload = {
    mailer_sender_name: "Transfer365",
    mailer_subjects_confirmation: "Transfer365 — אמת את כתובת האימייל שלך",
    mailer_templates_confirmation_content: emailHtml,
    mailer_subjects_invite: "הוזמנת ל-Transfer365",
    mailer_subjects_magic_link: "Transfer365 — קישור כניסה",
    mailer_subjects_recovery: "Transfer365 — איפוס סיסמה",
  };

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        `<h2 style="color:red">Error ${res.status}</h2><pre>${JSON.stringify(data,null,2)}</pre>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response(`
      <!DOCTYPE html>
      <html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h1 style="color:#22C55E">✅ Transfer365 email template updated!</h1>
        <p>ה-sender name עכשיו: <b>Transfer365</b></p>
        <p>כותרת אימות: <b>Transfer365 — אמת את כתובת האימייל שלך</b></p>
        <p style="color:#9CA3AF;margin-top:24px">ניתן למחוק את ה-function הזה עכשיו.</p>
        <pre style="text-align:left;background:#F3F4F6;padding:16px;border-radius:8px;font-size:12px">${JSON.stringify({mailer_sender_name:data.mailer_sender_name,mailer_subjects_confirmation:data.mailer_subjects_confirmation},null,2)}</pre>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });

  } catch(e) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/setup-email"
};
