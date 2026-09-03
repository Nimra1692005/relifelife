-- ═══════════════════════════════════════════════════════════
-- ReliefLink — Initial Database Schema (Supabase / PostgreSQL)
-- Matches the actual field sets used by the backend services
-- ═══════════════════════════════════════════════════════════
-- Run this whole file in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                TEXT PRIMARY KEY,          -- Supabase Auth UUID or app id
    full_name         TEXT NOT NULL,
    email             TEXT UNIQUE,
    phone             TEXT UNIQUE,
    role              TEXT NOT NULL DEFAULT 'citizen',  -- citizen|rescuer|admin|volunteer
    avatar_url        TEXT,
    blood_group       TEXT,
    emergency_contact TEXT,
    language_pref     TEXT DEFAULT 'en',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ─── SOS REQUESTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_requests (
    id                    TEXT PRIMARY KEY,      -- e.g. sos-a1b2c3
    user_id               TEXT NOT NULL,
    latitude              DOUBLE PRECISION NOT NULL,
    longitude             DOUBLE PRECISION NOT NULL,
    address_text          TEXT,
    emergency_type        TEXT,                  -- flood|fire|medical|earthquake|landslide|security|storm|other
    disaster_type         TEXT,
    urgency               TEXT NOT NULL DEFAULT 'high',   -- low|medium|high|critical
    message               TEXT,
    status                TEXT NOT NULL DEFAULT 'pending',-- pending|acknowledged|assigned|dispatched|resolved|cancelled
    priority              TEXT,
    estimated_eta_minutes INTEGER,
    assigned_team_id      TEXT,
    assigned_team_name    TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sos_status  ON sos_requests(status);
CREATE INDEX IF NOT EXISTS idx_sos_created ON sos_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_user    ON sos_requests(user_id);

-- ─── VOLUNTEERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
    id            TEXT PRIMARY KEY,              -- e.g. vol-a1b2c3
    user_id       TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    phone         TEXT,
    email         TEXT,
    skills        TEXT[] DEFAULT '{}',
    availability  TEXT NOT NULL DEFAULT 'available',  -- available|deployed|unavailable
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    verified      BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_availability ON volunteers(availability);
CREATE INDEX IF NOT EXISTS idx_volunteers_registered   ON volunteers(registered_at DESC);

-- ─── RESCUE TEAMS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rescue_teams (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    team_type           TEXT NOT NULL DEFAULT 'search_rescue', -- medical|search_rescue|fire|logistics|volunteer
    status              TEXT NOT NULL DEFAULT 'available',     -- available|deployed|on_break|offline
    current_lat         DOUBLE PRECISION,
    current_lng         DOUBLE PRECISION,
    members_count       INTEGER DEFAULT 0,
    contact_radio       TEXT,
    active_assignments  INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_status ON rescue_teams(status);

-- ─── DISASTER ALERTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    disaster_type TEXT,                          -- flood|earthquake|landslide|storm|fire
    severity      TEXT NOT NULL DEFAULT 'medium',-- low|medium|high|critical
    description   TEXT,
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    radius_km     DOUBLE PRECISION,
    location_text TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active  ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- ─── NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'system',  -- alert|sos_update|shelter|system
    title       TEXT NOT NULL,
    body        TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    severity    TEXT,                            -- low|medium|high|critical
    action_type TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ─── SHELTERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shelters (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    type              TEXT NOT NULL DEFAULT 'shelter', -- shelter|hospital|relief_camp|mosque|school
    latitude          DOUBLE PRECISION NOT NULL,
    longitude         DOUBLE PRECISION NOT NULL,
    address           TEXT,
    capacity          INTEGER DEFAULT 100,
    current_occupancy INTEGER DEFAULT 0,
    facilities        TEXT[] DEFAULT '{}',
    status            TEXT NOT NULL DEFAULT 'active', -- active|full|closed
    contact_phone     TEXT,
    verified          BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelters_status ON shelters(status);
CREATE INDEX IF NOT EXISTS idx_shelters_type   ON shelters(type);

-- ─── RISK ZONES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_zones (
    id            TEXT PRIMARY KEY,
    zone_name     TEXT NOT NULL,
    risk_level    TEXT NOT NULL,                 -- safe|low|medium|high|critical
    disaster_types TEXT[] DEFAULT '{}',
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    radius_km     DOUBLE PRECISION,
    last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_zones_level ON risk_zones(risk_level);

-- ─── AI CONVERSATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    language   TEXT DEFAULT 'en',
    messages   JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user    ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_updated ON ai_conversations(updated_at DESC);

-- ─── DEMO RESCUE TEAMS (optional seed) ─────────────────────
INSERT INTO rescue_teams (id, name, team_type, status, members_count, contact_radio) VALUES
    ('team-001', 'Alpha Rescue Squad', 'search_rescue', 'available', 8, 'CH-1'),
    ('team-002', 'Bravo Fire Unit',    'fire',          'available', 6, 'CH-2'),
    ('team-003', 'Charlie Support',    'medical',       'available', 5, 'CH-3')
ON CONFLICT (id) DO NOTHING;
