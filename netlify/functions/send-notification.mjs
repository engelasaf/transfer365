// netlify/functions/send-notification.mjs
// POST /api/send-notification
// Body: { userId, subject, message, alertType, playerName }
// Called internally when a new alert fires

async function sendEmail(to, subject, html) {
  const key = Netlify.env.get("RESEND_API_KEY");
  if (!key) return { error: "No RESEND_API_KEY" };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:    "Transfer365 <alerts@transfer365.net>",
      to:      [to],
      subject,
      html,
    }),
  });
  return r.json();
}

async function sendTelegram(chatId, text) {
  const token = Netlify.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return { error: "No TELEGRAM_BOT_TOKEN" };
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return r.json();
}

async function sendWhatsApp(to, body) {
  const sid   = Netlify.env.get("TWILIO_ACCOUNT_SID");
  const token = Netlify.env.get("TWILIO_AUTH_TOKEN");
  const from  = Netlify.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886"; // Twilio sandbox
  if (!sid || !token) return { error: "No Twilio credentials" };

  const params = new URLSearchParams({
    From: `whatsapp:${from}`,
    To:   `whatsapp:${to}`,
    Body: body,
  });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method:  "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body:    params,
  });
  return r.json();
}

async function getSettings(userId) {
  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!SB_URL || !SB_KEY) return null;
  const r = await fetch(
    `${SB_URL}/rest/v1/notification_settings?user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  const data = await r.json();
  return data?.[0] || null;
}

export default async (req) => {
  const cors = { "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("", { status: 200 });
  if (req.method !== "POST") return Response.json({ error: "POST only" }, { status: 405 });

  try {
    const { userId, subject, message, alertType, playerName } = await req.json();
    if (!userId || !message) return Response.json({ error: "userId and message required" }, { status: 400 });

    const settings = await getSettings(userId);
    if (!settings) return Response.json({ error: "No settings found for user" }, { status: 404 });

    const results = {};
    const emoji   = alertType === "injury" ? "🔴" : alertType === "contract" ? "🟡" : alertType === "transfer" ? "🚨" : "📢";
    const fullMsg  = `${emoji} Transfer365 Alert\n\n${subject}\n\n${message}`;
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#0D1A0D;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#22C55E;margin:0;font-size:18px">⚡ Transfer365</h2>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;border-radius:0 0 8px 8px">
          <h3 style="margin:0 0 12px;color:#1a1a2e">${emoji} ${subject}</h3>
          <p style="color:#495057;line-height:1.6;margin:0 0 16px">${message}</p>
          <a href="https://transfer365.net/app" style="display:inline-block;background:#3C3489;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px">פתח את האפליקציה →</a>
        </div>
        <p style="font-size:11px;color:#aaa;margin-top:12px;text-align:center">Transfer365 · <a href="https://transfer365.net">transfer365.net</a></p>
      </div>`;

    // Email
    if (settings.ch_email_on && settings.ch_email_val) {
      results.email = await sendEmail(settings.ch_email_val, `${emoji} ${subject}`, htmlBody);
    }

    // Telegram
    if (settings.ch_telegram_on && settings.ch_telegram_val) {
      const tgText = `<b>${emoji} Transfer365 Alert</b>\n\n<b>${subject}</b>\n\n${message}\n\n<a href="https://transfer365.net/app">פתח אפליקציה →</a>`;
      results.telegram = await sendTelegram(settings.ch_telegram_val, tgText);
    }

    // WhatsApp
    if (settings.ch_whatsapp_on && settings.ch_whatsapp_val) {
      results.whatsapp = await sendWhatsApp(settings.ch_whatsapp_val, fullMsg);
    }

    return Response.json({ success: true, channels: Object.keys(results), results }, { headers: cors });

  } catch(e) {
    console.error("send-notification error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/send-notification" };
