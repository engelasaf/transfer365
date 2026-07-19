// netlify/functions/me.mjs
// GET /api/me?email=USER_EMAIL
// Returns the user's current plan from Supabase (authoritative)
// Called on every app load to get real plan (not from localStorage)

import { PLANS, isActivePlan } from './_plans.mjs';

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-User-Email",
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url   = new URL(req.url);
  const email = url.searchParams.get("email") ||
                req.headers.get("x-user-email") || "";

  if (!email) return Response.json({ plan: "scout", status: "none" }, { headers: CORS });

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

  // No DB — return scout
  if (!SB_URL || !SB_KEY) {
    return Response.json({ plan: "scout", status: "no_db" }, { headers: CORS });
  }

  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/t365_subscribers?email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
    );
    const rows = await r.json();
    const sub  = Array.isArray(rows) ? rows[0] : null;

    if (!sub) {
      return Response.json({ plan: "scout", status: "not_found" }, { headers: CORS });
    }

    const activePlan = isActivePlan(sub.status) ? (sub.plan || "scout") : "scout";
    const planInfo   = PLANS[activePlan] || PLANS.scout;

    return Response.json({
      plan:         activePlan,
      status:       sub.status || "none",
      billing:      sub.billing || "monthly",
      plan_name:    planInfo.name,
      price:        planInfo.price_monthly,
      features:     planInfo.features,
      trial_ends:   sub.trial_ends || null,
      full_name:    sub.full_name || "",
      // Never expose sensitive billing data
    }, { headers: CORS });

  } catch(e) {
    console.error("me.mjs error:", e.message);
    return Response.json({ plan: "scout", status: "error" }, { headers: CORS });
  }
};

export const config = { path: "/api/me" };
