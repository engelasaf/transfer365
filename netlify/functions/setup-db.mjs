// netlify/functions/setup-db.mjs
// GET /api/setup-db?secret=SETUP_SECRET
// Run ONCE to create all required Supabase tables

const SQL = `
CREATE TABLE IF NOT EXISTS t365_players (
  id           BIGSERIAL PRIMARY KEY,
  player_id    INTEGER NOT NULL,
  name         TEXT NOT NULL,
  firstname    TEXT, lastname TEXT,
  age          INTEGER, nationality TEXT, photo TEXT,
  position     TEXT, team_id INTEGER, team_name TEXT,
  games_played INTEGER DEFAULT 0, goals INTEGER DEFAULT 0,
  assists      INTEGER DEFAULT 0, rating NUMERIC(4,2) DEFAULT 0,
  minutes      INTEGER DEFAULT 0, contract_end DATE, market_value NUMERIC(12,2),
  league_id    INTEGER NOT NULL DEFAULT 271,
  season       INTEGER NOT NULL DEFAULT 2025,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, league_id, season)
);

CREATE TABLE IF NOT EXISTS t365_injuries (
  id           BIGSERIAL PRIMARY KEY,
  player_id    INTEGER NOT NULL,
  player_name  TEXT, team_name TEXT,
  injury_type  TEXT, reason TEXT, fixture_id INTEGER,
  league_id    INTEGER DEFAULT 271, season INTEGER DEFAULT 2025,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season, injury_type)
);

CREATE TABLE IF NOT EXISTS t365_alerts (
  id           BIGSERIAL PRIMARY KEY,
  type         TEXT NOT NULL,
  player_id    INTEGER, player_name TEXT, team_name TEXT,
  title        TEXT NOT NULL, body TEXT,
  urgency      TEXT DEFAULT 'medium',
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id               BIGSERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL UNIQUE,
  email            TEXT,
  ch_email_on      BOOLEAN DEFAULT FALSE,
  ch_email_val     TEXT DEFAULT '',
  ch_whatsapp_on   BOOLEAN DEFAULT FALSE,
  ch_whatsapp_val  TEXT DEFAULT '',
  ch_telegram_on   BOOLEAN DEFAULT FALSE,
  ch_telegram_val  TEXT DEFAULT '',
  ch_push_on       BOOLEAN DEFAULT FALSE,
  timing           TEXT DEFAULT 'immediate',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_league_season ON t365_players(league_id, season);
CREATE INDEX IF NOT EXISTS idx_injuries_season       ON t365_injuries(season);
CREATE INDEX IF NOT EXISTS idx_alerts_urgency        ON t365_alerts(urgency, created_at);
`;

export default async (req) => {
  const url    = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const EXPECTED = Netlify.env.get("SETUP_SECRET") || "transfer365setup";

  if (secret !== EXPECTED) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_SERVICE_KEY") || Netlify.env.get("SUPABASE_ANON_KEY");

  if (!SB_URL || !SB_KEY) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  try {
    // Use Supabase SQL via rpc (requires service role or pg function)
    const r = await fetch(`${SB_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "apikey": SB_KEY,
        "Authorization": `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql: SQL }),
    });

    if (r.ok) {
      return Response.json({ success: true, message: "All tables created successfully" });
    }

    // Fallback: try each statement individually via Postgres endpoint
    const statements = SQL.split(";").map(s => s.trim()).filter(Boolean);
    const results = [];
    for (const stmt of statements) {
      const sr = await fetch(`${SB_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sql: stmt + ";" }),
      });
      results.push({ stmt: stmt.slice(0, 40), ok: sr.ok, status: sr.status });
    }

    return Response.json({ success: true, results, note: "Check Supabase for table status" });
  } catch (e) {
    return Response.json({ error: e.message, sql_to_run_manually: SQL }, { status: 500 });
  }
};

export const config = { path: "/api/setup-db" };
