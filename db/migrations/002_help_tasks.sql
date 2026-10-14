-- ═══════════════════════════════════════════════════════════
-- ReliefLink — Help Requests & Volunteer Tasks
-- Role-based platform: Help (affected), Volunteer, Admin
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════

-- ─── HELP REQUESTS ─────────────────────────────────────────
-- Submitted by "Help" role users (affected persons). Each request
-- can auto-generate a volunteer task in the coordinator queue.
CREATE TABLE IF NOT EXISTS help_requests (
    id          TEXT PRIMARY KEY,               -- e.g. RFL-1024
    user_id     TEXT NOT NULL,
    full_name   TEXT,
    phone       TEXT,
    city        TEXT,
    category    TEXT NOT NULL,                  -- medical|food|rescue|shelter|...
    description TEXT,
    urgency     TEXT NOT NULL DEFAULT 'high',   -- low|medium|high|critical
    status      TEXT NOT NULL DEFAULT 'pending',-- pending|assigned|in_progress|resolved
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_user   ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_created ON help_requests(created_at DESC);

-- ─── VOLUNTEER TASKS ───────────────────────────────────────
-- Coordinator-created (or auto-generated from a help request)
-- tasks that volunteers can claim, progress, and complete.
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id                   TEXT PRIMARY KEY,          -- e.g. task-a1b2c3
    request_id           TEXT REFERENCES help_requests(id) ON DELETE SET NULL,
    title                TEXT NOT NULL,
    category             TEXT NOT NULL,             -- food|medical|rescue|shelter|...
    city                 TEXT,
    distance_km          DOUBLE PRECISION DEFAULT 0,
    skills_needed        TEXT[] DEFAULT '{}',
    priority             TEXT NOT NULL DEFAULT 'medium', -- low|medium|high|critical
    status               TEXT NOT NULL DEFAULT 'open',   -- open|claimed|in_progress|completed
    assigned_volunteer_id TEXT,
    progress_note        TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_status   ON volunteer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON volunteer_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created  ON volunteer_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_volunteer ON volunteer_tasks(assigned_volunteer_id);
