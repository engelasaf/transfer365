// netlify/functions/admin.mjs
// GET /api/admin?secret=ADMIN_SECRET&action=users|stats
// POST /api/admin { secret, action, email, plan, status }

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function sbQuery(url, key, path, method = "GET", body = null) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation,resolution=merge-duplicates",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) {
    const errObj = text ? JSON.parse(text) : {};
    throw new Error(`Supabase ${r.status}: ${errObj.message || text.slice(0, 100)}`);
  }
  return text ? JSON.parse(text) : [];
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // ── Auth ────────────────────────────────────────────────────────────
  const url = new URL(req.url);
  let secret, body = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch(_) {}
    secret = body.secret;
  } else {
    secret = url.searchParams.get("secret");
  }

    const EXPECTED = (Netlify.env.get("ADMIN_SECRET") || "").trim();
  const provided = (secret || "").trim();

  // Log for debugging (never log actual secret values)
  console.log(`Admin auth attempt: provided_len=${provided.length}, expected_len=${EXPECTED.length}, match=${provided === EXPECTED}`);

  if (!provided || !EXPECTED || provided !== EXPECTED) {
    return Response.json({
      error: "Unauthorized — wrong secret key",
      hint: "Check ADMIN_SECRET in Netlify env vars matches what you typed",
    }, { status: 401, headers: CORS });
  }
  }

  // ── Supabase config — optional, degrade gracefully ──────────────────
  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  const hasDB  = !!(SB_URL && SB_KEY);

  const action = url.searchParams.get("action") || body.action || "users";

  // ── No DB configured — return empty shell ──────────────────────────
  if (!hasDB) {
    if (action === "users") {
      return Response.json({
        success: true, count: 0, users: [],
        warning: "SUPABASE_ANON_KEY not set in Netlify env vars. Visit /setup to configure.",
        setup_url: "https://transfer365.net/setup",
      }, { headers: CORS });
    }
    if (action === "stats") {
      return Response.json({
        success: true, byPlan: {}, mrr: 0, activeCount: 0,
        warning: "Supabase not configured",
      }, { headers: CORS });
    }
    return Response.json({
      success: false,
      error: "Supabase not configured — set SUPABASE_ANON_KEY in Netlify env vars",
      setup_url: "https://transfer365.net/setup",
    }, { status: 200, headers: CORS });
  }

  // ── With DB ─────────────────────────────────────────────────────────
  try {
    if (action === "users") {
      let users;
      try {
        users = await sbQuery(SB_URL, SB_KEY,
          "t365_subscribers?select=*&order=created_at.desc&limit=200");
      } catch(e) {
        // Table might not exist yet
        users = [];
        console.warn("t365_subscribers query failed:", e.message);
      }
      return Response.json({
        success: true,
        count: Array.isArray(users) ? users.length : 0,
        users: Array.isArray(users) ? users : [],
      }, { headers: CORS });
    }

    if (action === "stats") {
      let users = [];
      try {
        users = await sbQuery(SB_URL, SB_KEY,
          "t365_subscribers?select=plan,status&status=eq.active");
      } catch(_) {}
      const arr = Array.isArray(users) ? users : [];
      const byPlan = {};
      arr.forEach(u => { byPlan[u.plan] = (byPlan[u.plan] || 0) + 1; });
      const PRICES = { scout: 0, agent: 39, director: 99, executive: 249 };
      const mrr = arr.reduce((s, u) => s + (PRICES[u.plan] || 0), 0);
      return Response.json({ success: true, byPlan, mrr, activeCount: arr.length }, { headers: CORS });
    }

    if (action === "update_plan") {
      const { email, plan, status } = body;
      if (!email) return Response.json({ error: "email required" }, { status: 400, headers: CORS });
      const update = { updated_at: new Date().toISOString() };
      if (plan)   update.plan   = plan;
      if (status) update.status = status;
      const r = await sbQuery(SB_URL, SB_KEY,
        `t365_subscribers?email=eq.${encodeURIComponent(email)}`, "PATCH", update);
      return Response.json({ success: true, updated: r }, { headers: CORS });
    }

    if (action === "upsert_user") {
      const { email, plan, name, billing, ls_order_id } = body;
      if (!email) return Response.json({ error: "email required" }, { status: 400, headers: CORS });
      const row = {
        email, plan: plan || "scout", full_name: name || "",
        status: "active", billing: billing || "monthly",
        ls_order_id: ls_order_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const r = await sbQuery(SB_URL, SB_KEY, "t365_subscribers", "POST", [row]);
      return Response.json({ success: true, user: r }, { headers: CORS });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers: CORS });

  } catch(e) {
    console.error("admin error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
};

export const config = { path: "/api/admin" };
