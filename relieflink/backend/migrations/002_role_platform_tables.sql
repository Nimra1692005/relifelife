-- ═══════════════════════════════════════════════════════════
-- ReliefLink — Role-based platform tables (Supabase / PostgreSQL)
-- Adds the two tables the Help / Volunteer / Admin app writes to.
-- Hospitals are stored in the existing `shelters` table (type='hospital'),
-- so no separate hospitals table is required.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════

-- ─── HELP REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_requests (
    id          TEXT PRIMARY KEY,                 -- e.g. RFL-1234
    user_id     TEXT,
    full_name   TEXT,
    phone       TEXT,
    city        TEXT,
    category    TEXT NOT NULL,                    -- rescue|medical|food|shelter|clothing|transport|sanitation|special|recovery|missing|psychological|flood_predictor
    description TEXT,
    urgency     TEXT NOT NULL DEFAULT 'high',     -- low|medium|high|critical
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending|assigned|in_progress|resolved
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_requests_user   ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_created ON help_requests(created_at DESC);

-- ─── VOLUNTEER TASKS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id                    TEXT PRIMARY KEY,          -- e.g. task-a1b2c3
    request_id            TEXT,                       -- linked help_requests.id (nullable)
    title                 TEXT NOT NULL,
    category              TEXT,
    city                  TEXT,
    distance_km           DOUBLE PRECISION DEFAULT 0,
    skills_needed         TEXT[] DEFAULT '{}',
    priority              TEXT NOT NULL DEFAULT 'medium', -- low|medium|high|critical
    status                TEXT NOT NULL DEFAULT 'open',   -- open|claimed|in_progress|completed
    assigned_volunteer_id TEXT,
    progress_note         TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_status    ON volunteer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_volunteer ON volunteer_tasks(assigned_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created   ON volunteer_tasks(created_at DESC);
