-- 005_account_status.sql — self-service profile deactivation + deletion
-- Run this file in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- Adds an account status flag so a signed-in person can deactivate (soft, reversible)
-- or permanently remove (hard delete) their own profile from the Settings screen.
-- Existing rows default to 'active' so nothing changes until a user opts in.

ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'; -- active | deactivated
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Let the API filter deactivated accounts out of listings and look them up quickly.
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
