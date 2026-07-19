// netlify/functions/admin.mjs
// Transfer365 Admin API

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getEnv(key) {
  // Try both process.env and Netlify.env
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch(e) {}
  try {
    if (typeof Netlify !== "undefined" && Netlify.env) {
      return Netlify.env.get(key) || "";
    }
  } catch(e) {}
  return "";
}

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

  // Read secret from query (GET) or body (POST)
  const url = new URL(req.url);
  let secret = url.searchParams.get("secret") || "";
  let bodyData = {};

  if (req.method === "POST") {
    try { bodyData = await req.json(); } catch(_) {}
    if (!secret) secret = bodyData.secret || "";
  }

  // Auth check — use process.env + Netlify.env
  const ADMIN_SECRET = getEnv("ADMIN_SECRET");
  const provided     = secret.trim();
  const expected     = ADMIN_SECRET.trim();

  console.log(`[admin] auth: provided_len=${provided.length} expected_len=${expected.length} env_set=${!!expected}`);

  if (!provided || !expected || provided !== expected) {
    return Response.json(
      { error: "Unauthorized", hint: expected ? "Wrong password" : "ADMIN_SECRET env var not set in Netlify" },
      { status: 401, headers: CORS }
    );
  }

  const SB_URL = getEnv("SUPABASE_URL");
  const SB_KEY = getEnv("SUPABASE_ANON_KEY");
  const hasDB  = !!(SB_URL && SB_KEY);
  const action = url.searchParams.get("action") || bodyData.action || "users";

  // No DB — return empty shell
  if (!hasDB) {
    if (action === "users") {
      return Response.json({ success: true, count: 0, users: [],
        warning: "Supabase not configured — visit /setup" }, { headers: CORS });
    }
    if (action === "stats") {
      return Response.json({ success: true, byPlan: {}, mrr: 0, activeCount: 0 }, { headers: CORS });
    }
    return Response.json({ success: true, note: "No DB" }, { headers: CORS });
  }

  try {
    if (action === "users") {
      let users = [];
      try {
        users = await sbQuery(SB_URL, SB_KEY,
          "t365_subscribers?select=*&order=created_at.desc&limit=200");
      } catch(e) { users = []; }
      return Response.json({ success: true, count: users.length, users }, { headers: CORS });
    }

    if (action === "stats") {
      let users = [];
      try {
        users = await sbQuery(SB_URL, SB_KEY,
          "t365_subscribers?select=plan,status&status=eq.active");
      } catch(_) {}
      const arr    = Array.isArray(users) ? users : [];
      const byPlan = {};
      arr.forEach(u => { byPlan[u.plan] = (byPlan[u.plan] || 0) + 1; });
      const PRICES = { scout: 0, agent: 39, director: 99, executive: 249 };
      const mrr    = arr.reduce((s, u) => s + (PRICES[u.plan] || 0), 0);
      return Response.json({ success: true, byPlan, mrr, activeCount: arr.length }, { headers: CORS });
    }

    if (action === "update_plan") {
      const { email, plan, status } = bodyData;
      if (!email) return Response.json({ error: "email required" }, { status: 400, headers: CORS });
      const update = { updated_at: new Date().toISOString() };
      if (plan)   update.plan   = plan;
      if (status) update.status = status;
      const r = await sbQuery(SB_URL, SB_KEY,
        `t365_subscribers?email=eq.${encodeURIComponent(email)}`, "PATCH", update);
      return Response.json({ success: true, updated: r }, { headers: CORS });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers: CORS });

  } catch(e) {
    console.error("[admin] error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
};

export const config = { path: "/api/admin" };
