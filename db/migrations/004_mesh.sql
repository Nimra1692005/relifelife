-- ═══════════════════════════════════════════════════════════
-- ReliefLink — Mesh Network (real-time zone relay)
-- Neighbourhood chat + 1 km presence for people in the same zone.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
--
-- All access goes through the Vercel serverless dispatcher
-- (api/dispatch.js) using the service role key, so RLS is enabled
-- with no public policies — the anon key cannot read/write directly.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mesh_messages (
    id          TEXT PRIMARY KEY,               -- e.g. mesh-a1b2c3
    zone        TEXT NOT NULL,                  -- normalised (lowercase) area/city
    sender      TEXT NOT NULL DEFAULT 'Neighbour',
    body        TEXT NOT NULL,
    emergency   BOOLEAN NOT NULL DEFAULT FALSE, -- SOS flag
    latitude    DOUBLE PRECISION,               -- optional, powers the 1 km radar
    longitude   DOUBLE PRECISION,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesh_zone     ON mesh_messages(zone);
CREATE INDEX IF NOT EXISTS idx_mesh_created  ON mesh_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mesh_zone_time ON mesh_messages(zone, created_at DESC);

-- Lock the table down: service role (serverless) only. No anon access.
ALTER TABLE mesh_messages ENABLE ROW LEVEL SECURITY;
