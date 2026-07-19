// netlify/functions/_auth.mjs
// Server-side plan verification helper
// Import in any function that needs plan enforcement

import { canUsePlan, isActivePlan } from './_plans.mjs';

const SB_CACHE = new Map(); // simple in-process cache

async function getUserPlan(sbUrl, sbKey, email) {
  if (!email || !sbUrl || !sbKey) return 'scout';

  // Check cache (30s TTL)
  const cached = SB_CACHE.get(email);
  if (cached && Date.now() - cached.ts < 30000) return cached.plan;

  try {
    const r = await fetch(
      `${sbUrl}/rest/v1/t365_subscribers?email=eq.${encodeURIComponent(email)}&select=plan,status&limit=1`,
      { headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}` } }
    );
    const rows = await r.json();
    const sub  = Array.isArray(rows) ? rows[0] : null;
    const plan = (sub && isActivePlan(sub.status)) ? (sub.plan || 'scout') : 'scout';

    SB_CACHE.set(email, { plan, ts: Date.now() });
    return plan;
  } catch(e) {
    return 'scout'; // fail-open for non-critical endpoints
  }
}

// Use this in functions to enforce plan requirements
export async function requirePlan(req, minPlan, sbUrl, sbKey) {
  const url   = new URL(req.url);
  const email = url.searchParams.get("user_email") ||
                req.headers.get("x-user-email")    || "";

  if (!email) return { allowed: false, plan: 'scout', reason: 'No user email provided' };

  const userPlan = await getUserPlan(sbUrl, sbKey, email);
  const allowed  = canUsePlan(userPlan, minPlan);

  return {
    allowed,
    plan: userPlan,
    reason: allowed ? null : `${minPlan} plan required — you have ${userPlan}`,
  };
}

export const PLAN_ERR = (minPlan, userPlan) => Response.json({
  error: `This feature requires ${minPlan} plan or higher`,
  your_plan: userPlan,
  upgrade_url: "https://transfer365.net/#pricing",
}, { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
