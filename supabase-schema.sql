-- Run this in Supabase SQL Editor
-- Transfer365 — Player Data Schema

CREATE TABLE IF NOT EXISTS t365_players (
  id            BIGSERIAL PRIMARY KEY,
  player_id     INTEGER NOT NULL,
  name          TEXT NOT NULL,
  firstname     TEXT,
  lastname      TEXT,
  age           INTEGER,
  nationality   TEXT,
  photo         TEXT,
  position      TEXT,
  team_id       INTEGER,
  team_name     TEXT,
  games_played  INTEGER DEFAULT 0,
  goals         INTEGER DEFAULT 0,
  assists       INTEGER DEFAULT 0,
  rating        NUMERIC(4,2) DEFAULT 0,
  minutes       INTEGER DEFAULT 0,
  contract_end  DATE,
  market_value  NUMERIC(12,2),
  league_id     INTEGER NOT NULL DEFAULT 271,
  season        INTEGER NOT NULL DEFAULT 2025,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, league_id, season)
);

CREATE TABLE IF NOT EXISTS t365_injuries (
  id           BIGSERIAL PRIMARY KEY,
  player_id    INTEGER NOT NULL,
  player_name  TEXT,
  team_name    TEXT,
  injury_type  TEXT,
  reason       TEXT,
  fixture_id   INTEGER,
  league_id    INTEGER DEFAULT 271,
  season       INTEGER DEFAULT 2025,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season, injury_type)
);

CREATE TABLE IF NOT EXISTS t365_alerts (
  id           BIGSERIAL PRIMARY KEY,
  type         TEXT NOT NULL,
  player_id    INTEGER,
  player_name  TEXT,
  team_name    TEXT,
  title        TEXT NOT NULL,
  body         TEXT,
  urgency      TEXT DEFAULT 'medium',
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - optional for now
-- ALTER TABLE t365_players ENABLE ROW LEVEL SECURITY;

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_players_league_season ON t365_players(league_id, season);
CREATE INDEX IF NOT EXISTS idx_players_team ON t365_players(team_name);
CREATE INDEX IF NOT EXISTS idx_injuries_season ON t365_injuries(season);
CREATE INDEX IF NOT EXISTS idx_alerts_urgency ON t365_alerts(urgency, created_at);
