// netlify/functions/setup-db.mjs
// GET /api/setup-db?secret=SETUP_SECRET&svc_key=SUPABASE_SERVICE_KEY
// Creates all required tables. Run once.

const TABLES = [
  `CREATE TABLE IF NOT EXISTS notification_settings (
    id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, email TEXT,
    ch_email_on BOOLEAN DEFAULT FALSE, ch_email_val TEXT DEFAULT '',
    ch_whatsapp_on BOOLEAN DEFAULT FALSE, ch_whatsapp_val TEXT DEFAULT '',
    ch_telegram_on BOOLEAN DEFAULT FALSE, ch_telegram_val TEXT DEFAULT '',
    ch_push_on BOOLEAN DEFAULT FALSE, timing TEXT DEFAULT 'immediate',
    updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS t365_subscribers (
    id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE,
    full_name TEXT DEFAULT '', plan TEXT NOT NULL DEFAULT 'scout',
    status TEXT NOT NULL DEFAULT 'active', billing TEXT DEFAULT 'monthly',
    ls_order_id TEXT, trial_ends TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS t365_players (
    id BIGSERIAL PRIMARY KEY, player_id INTEGER NOT NULL,
    name TEXT NOT NULL, firstname TEXT, lastname TEXT, age INTEGER,
    nationality TEXT, photo TEXT, position TEXT, team_id INTEGER, team_name TEXT,
    games_played INTEGER DEFAULT 0, goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0, rating NUMERIC(4,2) DEFAULT 0, minutes INTEGER DEFAULT 0,
    contract_end DATE, market_value NUMERIC(12,2),
    league_id INTEGER NOT NULL DEFAULT 271, season INTEGER NOT NULL DEFAULT 2025,
    updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(player_id, league_id, season))`,
  `CREATE TABLE IF NOT EXISTS t365_injuries (
    id BIGSERIAL PRIMARY KEY, player_id INTEGER NOT NULL,
    player_name TEXT, team_name TEXT, injury_type TEXT, reason TEXT,
    league_id INTEGER DEFAULT 271, season INTEGER DEFAULT 2025,
    updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(player_id, season, injury_type))`,
  `CREATE TABLE IF NOT EXISTS t365_alerts (
    id BIGSERIAL PRIMARY KEY, type TEXT NOT NULL,
    player_id INTEGER, player_name TEXT, team_name TEXT,
    title TEXT NOT NULL, body TEXT, urgency TEXT DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_sub_email  ON t365_subscribers(email)`,
  `CREATE INDEX IF NOT EXISTS idx_sub_plan   ON t365_subscribers(plan)`,
  `CREATE INDEX IF NOT EXISTS idx_pl_league  ON t365_players(league_id, season)`,
  `CREATE INDEX IF NOT EXISTS idx_al_urgency ON t365_alerts(urgency, created_at)`,
];

async function runSQL(sbUrl, sbKey, sql) {
  const r = await fetch(`${sbUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: text };
}

export default async (req) => {
  const cors = { "Content-Type": "application/json" };
  const url  = new URL(req.url);

  const secret   = url.searchParams.get("secret");
  const EXPECTED = Netlify.env.get("SETUP_SECRET") || "transfer365setup2026";
  if (secret !== EXPECTED) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  // Accept service key via param (setup page) or env var
  const SB_SVC = url.searchParams.get("svc_key") ||
                  Netlify.env.get("SUPABASE_SERVICE_KEY") ||
                  Netlify.env.get("SUPABASE_ANON_KEY");

  if (!SB_URL || !SB_SVC) {
    return Response.json({
      error: "Supabase service key required",
      hint: "Pass ?svc_key=YOUR_SERVICE_ROLE_KEY or set SUPABASE_SERVICE_KEY in Netlify env vars",
      setup_url: "https://supabase.com/dashboard/project/hivyothlbntxcbsilktp/settings/api"
    }, { status: 400, headers: cors });
  }

  const results = [];
  for (const sql of TABLES) {
    const label = sql.trim().split('\n')[0].slice(0, 60);
    try {
      const r = await runSQL(SB_URL, SB_SVC, sql);
      results.push({ sql: label, ok: r.ok, status: r.status,
        note: r.ok ? "created" : (r.body.includes("already exists") ? "exists" : r.body.slice(0,100)) });
    } catch(e) {
      results.push({ sql: label, ok: false, error: e.message });
    }
  }

  const allOk = results.every(r => r.ok || r.note === "exists");
  return Response.json({ success: allOk, tables: results.length, results }, { headers: cors });
};

export const config = { path: "/api/setup-db" };
