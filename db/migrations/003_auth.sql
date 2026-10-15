-- 003_auth.sql — real accounts: phone + password authentication
-- Run in the Supabase SQL editor (same place the other tables were created).

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Fast lookup by normalised phone (03XXXXXXXXX) for sign-in and duplicate checks.
-- Non-unique on purpose: legacy rows may contain duplicates; the API rejects new dupes.
CREATE INDEX IF NOT EXISTS users_phone_idx ON users (phone);
