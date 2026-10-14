-- ═══════════════════════════════════════════════════════════
-- ReliefLink — One-shot Supabase setup
-- Paste this ENTIRE file into: Supabase → SQL Editor → New query → Run
-- Creates every table the web app uses + a little seed data.
-- (The API uses the service_role key, which bypasses RLS.)
-- ═══════════════════════════════════════════════════════════

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT, phone TEXT,
    role TEXT NOT NULL DEFAULT 'citizen', city TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOLUNTEERS
CREATE TABLE IF NOT EXISTS volunteers (
    id TEXT PRIMARY KEY, user_id TEXT, full_name TEXT NOT NULL, phone TEXT, email TEXT,
    skills TEXT[] DEFAULT '{}', availability TEXT DEFAULT 'available',
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, verified BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- HELP REQUESTS
CREATE TABLE IF NOT EXISTS help_requests (
    id TEXT PRIMARY KEY, user_id TEXT, full_name TEXT, phone TEXT, city TEXT,
    category TEXT NOT NULL, description TEXT, urgency TEXT DEFAULT 'high',
    status TEXT NOT NULL DEFAULT 'pending', latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_created ON help_requests(created_at DESC);

-- VOLUNTEER TASKS
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id TEXT PRIMARY KEY, request_id TEXT, title TEXT NOT NULL, category TEXT, city TEXT,
    distance_km DOUBLE PRECISION DEFAULT 0, skills_needed TEXT[] DEFAULT '{}',
    priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'open',
    assigned_volunteer_id TEXT, progress_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_task_status ON volunteer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_vol ON volunteer_tasks(assigned_volunteer_id);

-- SHELTERS (also stores hospitals via type='hospital')
CREATE TABLE IF NOT EXISTS shelters (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT DEFAULT 'shelter',
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, address TEXT,
    capacity INTEGER DEFAULT 100, current_occupancy INTEGER DEFAULT 0,
    facilities TEXT[] DEFAULT '{}', status TEXT DEFAULT 'active',
    contact_phone TEXT, verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALERTS (feeds the admin map markers)
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, disaster_type TEXT, severity TEXT DEFAULT 'medium',
    description TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, radius_km DOUBLE PRECISION,
    location_text TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED DATA ─────────────────────────────────────────────
INSERT INTO shelters (id, name, type, latitude, longitude, address, capacity, current_occupancy) VALUES
    ('shl-001', 'District Relief Camp A', 'shelter', 30.1575, 71.5249, 'Multan Bypass', 500, 210),
    ('shl-002', 'Rescue Base Camp Rajanpur', 'shelter', 29.1044, 70.3302, 'Rajanpur Main Road', 300, 90),
    ('hsp-001', 'City General Hospital', 'hospital', 30.1575, 71.5249, 'Multan', 200, 120),
    ('hsp-002', 'Emergency Medical Centre', 'hospital', 29.1044, 70.3302, 'Rajanpur', 120, 40)
ON CONFLICT (id) DO NOTHING;

INSERT INTO volunteer_tasks (id, title, category, city, distance_km, skills_needed, priority, status) VALUES
    ('task-001', 'Boat rescue — stranded families', 'rescue', 'Rajanpur', 3.2, ARRAY['Boat handling','Swimming'], 'critical', 'open'),
    ('task-002', 'Medical camp support', 'medical', 'Multan', 5.8, ARRAY['First aid','Nursing'], 'high', 'open'),
    ('task-003', 'Food pack distribution', 'food', 'Dera Ghazi Khan', 2.1, ARRAY['Driving','Logistics'], 'medium', 'open'),
    ('task-004', 'Shelter setup for displaced', 'shelter', 'Muzaffargarh', 7.4, ARRAY['Carpentry','Labour'], 'high', 'open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO alerts (id, title, disaster_type, severity, location_text, latitude, longitude, radius_km, is_active) VALUES
    ('alr-001', 'Indus flood warning', 'flood', 'high', 'Southern Punjab', 29.5, 70.7, 40, TRUE)
ON CONFLICT (id) DO NOTHING;
