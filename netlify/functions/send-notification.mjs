
// Inline plan config (no cross-file imports)
const PLAN_RANK = { scout: 0, agent: 1, director: 2, executive: 3 };
function canUsePlan(userPlan, minPlan) {
  return (PLAN_RANK[userPlan] || 0) >= (PLAN_RANK[minPlan] || 0);
}
function isActivePlan(status) {
  return ['active', 'trialing'].includes(status);
}
async function getUserPlan(sbUrl, sbKey, email) {
  if (!sbUrl || !sbKey || !email) return 'scout';
  try {
    const r = await fetch(
      `${sbUrl}/rest/v1/t365_subscribers?email=eq.${encodeURIComponent(email)}&select=plan,status&limit=1`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const rows = await r.json();
    const sub = Array.isArray(rows) ? rows[0] : null;
    return (sub && isActivePlan(sub.status)) ? (sub.plan || 'scout') : 'scout';
  } catch(e) { return 'scout'; }
}
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers: CORS });
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;
  let body;
  try { body = await req.json(); } catch(e) { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }
  const { userId, subject, message, alertType } = body;
  if (!userId || !message) return Response.json({ error: 'userId and message required' }, { status: 400, headers: CORS });
  if (!SB_URL || !SB_KEY) return Response.json({ success: false, note: 'DB not configured' }, { headers: CORS });
  try {
    const r = await fetch(`${SB_URL}/rest/v1/notification_settings?user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    const rows = await r.json();
    const settings = rows?.[0];
    if (!settings) return Response.json({ error: 'No settings found' }, { status: 404, headers: CORS });
    const results = {};
    const emoji = { injury:'🔴', contract:'🟡', transfer:'🚨', test:'📢' }[alertType] || '📢';
    if (settings.ch_email_on && settings.ch_email_val) {
      const key = process.env.RESEND_API_KEY;
      if (key) {
        const er = await fetch('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'Transfer365 <alerts@transfer365.net>', to: [settings.ch_email_val], subject: `${emoji} ${subject}`,
            html: `<p>${message}</p><a href="https://transfer365.net/app">Open app →</a>` }),
        });
        results.email = await er.json();
      }
    }
    if (settings.ch_telegram_on && settings.ch_telegram_val) {
      const tok = process.env.TELEGRAM_BOT_TOKEN;
      if (tok) {
        const tr = await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: settings.ch_telegram_val, text: `${emoji} ${subject}\n${message}` }),
        });
        results.telegram = await tr.json();
      }
    }
    return Response.json({ success: true, results }, { headers: CORS });
  } catch(e) { return Response.json({ error: e.message }, { status: 500, headers: CORS }); }
};
export const config = { path: '/api/send-notification' };
