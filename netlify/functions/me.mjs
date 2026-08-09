
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
  const url   = new URL(req.url);
  const email = url.searchParams.get('email') || req.headers.get('x-user-email') || '';
  if (!email) return Response.json({ plan: 'scout', status: 'none' }, { headers: CORS });
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return Response.json({ plan: 'scout', status: 'no_db' }, { headers: CORS });
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/t365_subscribers?email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const rows = await r.json();
    const sub  = Array.isArray(rows) ? rows[0] : null;
    if (!sub) return Response.json({ plan: 'scout', status: 'not_found' }, { headers: CORS });
    const plan = isActivePlan(sub.status) ? (sub.plan || 'scout') : 'scout';
    return Response.json({ plan, status: sub.status, billing: sub.billing, full_name: sub.full_name }, { headers: CORS });
  } catch(e) {
    return Response.json({ plan: 'scout', status: 'error' }, { headers: CORS });
  }
};
export const config = { path: '/api/me' };
