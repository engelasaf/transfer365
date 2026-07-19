// netlify/functions/send-notification.mjs
// POST /api/send-notification
// Requires agent+ plan for email/telegram, director+ for whatsapp

import { requirePlan, PLAN_ERR } from './_auth.mjs';

async function sendEmail(to, subject, html, apiKey) {
  if (!apiKey) return { error: 'No RESEND_API_KEY' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Transfer365 <alerts@transfer365.net>', to: [to], subject, html }),
  });
  return r.json();
}

async function sendTelegram(chatId, text, token) {
  if (!token) return { error: 'No TELEGRAM_BOT_TOKEN' };
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  return r.json();
}

async function sendWhatsApp(to, body, sid, token, from) {
  if (!sid || !token) return { error: 'No Twilio credentials' };
  const params = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body });
  const auth   = Buffer.from(`${sid}:${token}`).toString('base64');
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  return r.json();
}

async function getSettings(sbUrl, sbKey, userId) {
  if (!sbUrl || !sbKey) return null;
  const r = await fetch(`${sbUrl}/rest/v1/notification_settings?user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } });
  const d = await r.json();
  return d?.[0] || null;
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type' };

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });

  const SB_URL = Netlify.env.get('SUPABASE_URL');
  const SB_KEY = Netlify.env.get('SUPABASE_ANON_KEY');

  let body;
  try { body = await req.json(); } catch(e) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const { userId, subject, message, alertType } = body;
  if (!userId || !message) return Response.json({ error: 'userId and message required' }, { status: 400, headers: CORS });

  // ── Server-side plan enforcement ────────────────────────────────
  const { allowed, plan } = await requirePlan(
    new Request(req.url + `?user_email=${encodeURIComponent(userId)}`),
    'agent', SB_URL, SB_KEY
  );
  if (!allowed) return PLAN_ERR('agent', plan);

  const settings = await getSettings(SB_URL, SB_KEY, userId);
  if (!settings) return Response.json({ error: 'No notification settings found' }, { status: 404, headers: CORS });

  const results = {};
  const emoji   = { injury:'🔴', contract:'🟡', transfer:'🚨', test:'📢' }[alertType] || '📢';
  const htmlBody = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
    <div style="background:#0D1A0D;padding:20px 24px;border-radius:8px 8px 0 0">
      <h2 style="color:#22C55E;margin:0">⚡ Transfer365</h2></div>
    <div style="background:#fff;padding:24px;border:1px solid #eee;border-radius:0 0 8px 8px">
      <h3 style="margin:0 0 12px;color:#1a1a2e">${emoji} ${subject}</h3>
      <p style="color:#495057;line-height:1.6;margin:0 0 16px">${message}</p>
      <a href="https://transfer365.net/app" style="display:inline-block;background:#3C3489;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px">Open app →</a>
    </div></div>`;

  if (settings.ch_email_on && settings.ch_email_val) {
    results.email = await sendEmail(settings.ch_email_val, `${emoji} ${subject}`, htmlBody,
      Netlify.env.get('RESEND_API_KEY'));
  }
  if (settings.ch_telegram_on && settings.ch_telegram_val) {
    results.telegram = await sendTelegram(settings.ch_telegram_val,
      `<b>${emoji} Transfer365</b>\n<b>${subject}</b>\n${message}`,
      Netlify.env.get('TELEGRAM_BOT_TOKEN'));
  }
  if (settings.ch_whatsapp_on && settings.ch_whatsapp_val) {
    // Check director+ plan for WhatsApp
    const whResult = await requirePlan(
      new Request(req.url + `?user_email=${encodeURIComponent(userId)}`),
      'director', SB_URL, SB_KEY
    );
    if (whResult.allowed) {
      results.whatsapp = await sendWhatsApp(
        settings.ch_whatsapp_val, `${emoji} Transfer365\n${subject}\n${message}`,
        Netlify.env.get('TWILIO_ACCOUNT_SID'),
        Netlify.env.get('TWILIO_AUTH_TOKEN'),
        Netlify.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886'
      );
    } else {
      results.whatsapp = { error: 'director plan required' };
    }
  }

  return Response.json({ success: true, channels: Object.keys(results), results }, { headers: CORS });
};

export const config = { path: '/api/send-notification' };
