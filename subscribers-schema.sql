-- Add to existing Supabase schema
CREATE TABLE IF NOT EXISTS t365_subscribers (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  full_name    TEXT DEFAULT '',
  plan         TEXT NOT NULL DEFAULT 'scout'
                CHECK (plan IN ('scout','agent','director','executive')),
  status       TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','trial','cancelled','paused')),
  billing      TEXT DEFAULT 'monthly' CHECK (billing IN ('monthly','annual')),
  ls_order_id  TEXT,
  trial_ends   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscribers_email  ON t365_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_plan   ON t365_subscribers(plan);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON t365_subscribers(status);
