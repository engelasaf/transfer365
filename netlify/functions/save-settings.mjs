
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
  const { userId, email, channels, timing } = body;
  if (!userId && !email) return Response.json({ error: 'userId or email required' }, { status: 400, headers: CORS });
  if (!SB_URL || !SB_KEY) return Response.json({ success: true, note: 'DB not configured' }, { headers: CORS });
  const row = {
    user_id: userId || email, email: email || '',
    ch_email_on: channels?.email?.on ?? false, ch_email_val: channels?.email?.val ?? '',
    ch_whatsapp_on: channels?.whatsapp?.on ?? false, ch_whatsapp_val: channels?.whatsapp?.val ?? '',
    ch_telegram_on: channels?.telegram?.on ?? false, ch_telegram_val: channels?.telegram?.val ?? '',
    ch_push_on: channels?.push?.on ?? false, timing: timing || 'immediate',
    updated_at: new Date().toISOString(),
  };
  try {
    const r = await fetch(`${SB_URL}/rest/v1/notification_settings?on_conflict=user_id`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([row]),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return Response.json({ success: true }, { headers: CORS });
  } catch(e) { return Response.json({ error: e.message }, { status: 500, headers: CORS }); }
};
export const config = { path: '/api/save-settings' };
