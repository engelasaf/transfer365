// netlify/functions/admin.mjs
// GET /api/admin?secret=ADMIN_SECRET
// GET /api/admin?secret=...&action=users|stats|plan&email=...
// POST /api/admin  { secret, action:"update_plan", email, plan }

async function sb(sbUrl, sbKey, path, method="GET", body=null) {
  const r = await fetch(`${sbUrl}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": sbKey,
      "Authorization": `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      "Prefer": method==="POST" ? "resolution=merge-duplicates,return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return text ? JSON.parse(text) : [];
}

export default async (req) => {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://transfer365.net",
  };

  const url    = new URL(req.url);
  const secret = req.method === "POST"
    ? (await req.json().catch(()=>({}))).secret
    : url.searchParams.get("secret");

  const ADMIN_SECRET = Netlify.env.get("ADMIN_SECRET") || "t365admin2026";
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!SB_URL || !SB_KEY) return Response.json({ error: "DB not configured" }, { status: 500 });

  const action = url.searchParams.get("action") || "users";

  try {
    if (action === "users") {
      // All subscribers
      const users = await sb(SB_URL, SB_KEY,
        "t365_subscribers?select=*&order=created_at.desc&limit=200");
      return Response.json({ success: true, count: users.length, users }, { headers: cors });
    }

    if (action === "stats") {
      const [all, active, users] = await Promise.all([
        sb(SB_URL, SB_KEY, "t365_subscribers?select=count"),
        sb(SB_URL, SB_KEY, "t365_subscribers?select=count&status=eq.active"),
        sb(SB_URL, SB_KEY, "t365_subscribers?select=plan&status=eq.active"),
      ]);
      const byPlan = {};
      users.forEach(u => { byPlan[u.plan] = (byPlan[u.plan]||0) + 1; });
      const mrr = users.reduce((s,u) => {
        const prices = { scout: 0, agent: 39, director: 99, executive: 249 };
        return s + (prices[u.plan] || 0);
      }, 0);
      return Response.json({ success: true, byPlan, mrr, activeCount: active.length }, { headers: cors });
    }

    if (action === "update_plan" && req.method === "POST") {
      const body = await req.json().catch(()=>({}));
      const { email, plan, status } = body;
      if (!email) return Response.json({ error: "email required" }, { status: 400 });
      const update = {};
      if (plan)   update.plan   = plan;
      if (status) update.status = status;
      update.updated_at = new Date().toISOString();
      const r = await sb(SB_URL, SB_KEY,
        `t365_subscribers?email=eq.${encodeURIComponent(email)}`,
        "PATCH", update);
      return Response.json({ success: true, updated: r }, { headers: cors });
    }

    if (action === "upsert_user") {
      // Called by LemonSqueezy webhook on payment
      const body = req.method === "POST" ? await req.json().catch(()=>({})) : {};
      const { email, plan, name, billing, ls_order_id } = body;
      const row = {
        email, plan: plan||"scout", full_name: name||"",
        status: "active", billing: billing||"monthly",
        ls_order_id: ls_order_id||null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const r = await sb(SB_URL, SB_KEY, "t365_subscribers", "POST", [row]);
      return Response.json({ success: true, user: r }, { headers: cors });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: cors });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/admin" };
