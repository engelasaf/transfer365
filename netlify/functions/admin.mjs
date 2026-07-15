// netlify/functions/admin.mjs
// GET /api/admin?secret=ADMIN_SECRET&action=users|stats
// POST /api/admin { secret, action, email, plan, status }

async function sb(sbUrl, sbKey, path, method="GET", body=null) {
  const r = await fetch(`${sbUrl}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": sbKey,
      "Authorization": `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST"
        ? "resolution=merge-duplicates,return=representation"
        : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  // Return empty array if table doesn't exist yet
  if (!r.ok) {
    console.error(`Supabase ${path}: ${r.status} ${text.slice(0,100)}`);
    return Array.isArray(body) ? [] : {};
  }
  return text ? JSON.parse(text) : [];
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);

  // Get secret from query param (GET) or body (POST)
  let secret, bodyData = {};
  if (req.method === "POST") {
    try { bodyData = await req.json(); } catch(_) {}
    secret = bodyData.secret;
  } else {
    secret = url.searchParams.get("secret");
  }

  const ADMIN_SECRET = Netlify.env.get("ADMIN_SECRET") || "t365admin2026";
  if (!secret || secret !== ADMIN_SECRET) {
    console.log(`Auth fail: got "${secret}", expected "${ADMIN_SECRET}"`);
    return Response.json({ error: "Unauthorized — wrong secret key" }, { status: 401, headers: CORS });
  }

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!SB_URL || !SB_KEY) {
    return Response.json({ error: "Supabase not configured" }, { status: 500, headers: CORS });
  }

  const action = url.searchParams.get("action") || bodyData.action || "users";

  try {
    // ── GET users ──────────────────────────────────────────────────
    if (action === "users") {
      const users = await sb(SB_URL, SB_KEY,
        "t365_subscribers?select=*&order=created_at.desc&limit=200");
      return Response.json({
        success: true,
        count: Array.isArray(users) ? users.length : 0,
        users: Array.isArray(users) ? users : [],
        note: Array.isArray(users) && users.length === 0
          ? "Table empty or not created yet — visit /setup to initialize"
          : null,
      }, { headers: CORS });
    }

    // ── GET stats ──────────────────────────────────────────────────
    if (action === "stats") {
      const users = await sb(SB_URL, SB_KEY,
        "t365_subscribers?select=plan,status&status=eq.active");
      const arr = Array.isArray(users) ? users : [];
      const byPlan = {};
      arr.forEach(u => { byPlan[u.plan] = (byPlan[u.plan] || 0) + 1; });
      const PRICES = { scout: 0, agent: 39, director: 99, executive: 249 };
      const mrr = arr.reduce((s, u) => s + (PRICES[u.plan] || 0), 0);
      return Response.json({
        success: true, byPlan, mrr, activeCount: arr.length,
      }, { headers: CORS });
    }

    // ── POST update plan/status ─────────────────────────────────────
    if (action === "update_plan") {
      const { email, plan, status } = bodyData;
      if (!email) return Response.json({ error: "email required" }, { status: 400, headers: CORS });
      const update = { updated_at: new Date().toISOString() };
      if (plan)   update.plan   = plan;
      if (status) update.status = status;
      const r = await sb(SB_URL, SB_KEY,
        `t365_subscribers?email=eq.${encodeURIComponent(email)}`,
        "PATCH", update);
      return Response.json({ success: true, updated: r }, { headers: CORS });
    }

    // ── POST upsert user (called by webhook) ────────────────────────
    if (action === "upsert_user") {
      const { email, plan, name, billing, ls_order_id } = bodyData;
      if (!email) return Response.json({ error: "email required" }, { status: 400, headers: CORS });
      const row = {
        email, plan: plan || "scout", full_name: name || "",
        status: "active", billing: billing || "monthly",
        ls_order_id: ls_order_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const r = await sb(SB_URL, SB_KEY, "t365_subscribers", "POST", [row]);
      return Response.json({ success: true, user: r }, { headers: CORS });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers: CORS });

  } catch(e) {
    console.error("admin error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
};

export const config = { path: "/api/admin" };
