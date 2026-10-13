/**
 * ReliefLink — Vercel Serverless API (Node.js)
 * Serves the exact /api/v1/* contract the web app expects and stores data
 * in Supabase (PostgREST). No external npm deps — uses global fetch (Node 18+).
 *
 * Env (set in Vercel project):
 *   SUPABASE_URL          e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role secret (server-side only, never exposed)
 *   ADMIN_EMAIL / ADMIN_PASSWORD  for the admin sign-in gate
 */

const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const ST_LABEL = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' };
const CAT_LABEL = {
  rescue: 'Rescue', medical: 'Medical', food: 'Food', shelter: 'Shelter', clothing: 'Clothing',
  transport: 'Transport', sanitation: 'Sanitation', special: 'Special', recovery: 'Recovery',
  missing: 'Missing', psychological: 'Support', flood_predictor: 'Flood'
};

/* ── Supabase REST helpers ─────────────────────────────── */
function rid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 8); }
function nowIso() { return new Date().toISOString(); }

async function sb(table, { method = 'GET', query, body, prefer } = {}) {
  let url = SB_URL + '/rest/v1/' + table;
  const qs = Object.assign({}, query);
  const params = new URLSearchParams();
  for (const k in qs) { const v = qs[k]; if (v != null) params.append(k, String(v)); }
  const q = params.toString();
  if (q) url += '?' + q;
  const headers = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(url, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error('supabase ' + r.status + ' ' + JSON.stringify(data));
  return data;
}

async function sbCount(table, filter) {
  let url = SB_URL + '/rest/v1/' + table + '?select=id' + (filter ? '&' + filter : '');
  const r = await fetch(url, { method: 'HEAD', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Prefer: 'count=exact' } });
  const cr = r.headers.get('content-range') || r.headers.get('Content-Range') || '';
  const m = cr.split('/');
  return m.length > 1 ? parseInt(m[1], 10) || 0 : 0;
}

/* ── Response helpers ──────────────────────────────────── */
function ok(res, data, message) { res.status(200).json({ success: true, data: data == null ? null : data, message: message || '' }); }
function fail(res, message, status) { res.status(status || 400).json({ success: false, data: null, message: message || 'error' }); }

/* ── Endpoint handlers ─────────────────────────────────── */
async function createHelpRequest(res, b) {
  const row = {
    id: rid('RFL'),
    user_id: b.user_id || null,
    full_name: b.full_name || 'Citizen',
    phone: b.phone || '',
    city: b.city || '',
    category: b.category || 'special',
    description: b.description || '',
    urgency: b.urgent ? 'critical' : (b.urgency || 'high'),
    status: 'pending',
    latitude: b.latitude != null ? b.latitude : null,
    longitude: b.longitude != null ? b.longitude : null,
    created_at: nowIso(), updated_at: nowIso()
  };
  const out = await sb('help_requests', { method: 'POST', body: row, prefer: 'return=representation' });
  ok(res, (out && out[0]) || row, 'Request received');
}

async function listHelpRequests(res, q) {
  const limit = Math.min(parseInt(q.limit, 10) || 100, 500);
  const query = { select: '*', order: 'created_at.desc', limit: String(limit) };
  if (q.user_id) query.user_id = 'eq.' + q.user_id;
  const rows = await sb('help_requests', { query });
  ok(res, rows || []);
}

async function registerRole(res, b) {
  const uid = rid('usr');
  const user = { id: uid, full_name: b.full_name || 'User', phone: b.phone || '', email: b.email || null, role: b.role || 'citizen', city: b.city || null, created_at: nowIso(), updated_at: nowIso() };
  await sb('users', { method: 'POST', body: user, prefer: 'return=representation' });
  if (b.role === 'volunteer') {
    const vol = { id: rid('vol'), user_id: uid, full_name: b.full_name || 'Volunteer', phone: b.phone || '', skills: b.skills || [], availability: b.availability || 'available', registered_at: nowIso() };
    await sb('volunteers', { method: 'POST', body: vol, prefer: 'return=representation' });
  }
  ok(res, { user: { id: uid, full_name: user.full_name } }, 'Registered');
}

async function adminSignin(res, b) {
  const wantEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const wantPw = process.env.ADMIN_PASSWORD || '';
  const email = (b.email || '').toLowerCase();
  if (wantEmail && wantPw && email === wantEmail && b.password === wantPw) {
    return ok(res, { user: { id: 'admin', email }, token: 'session-' + rid('tok') }, 'Signed in');
  }
  if (!wantEmail || !wantPw) {
    // No admin credentials configured yet — allow a soft demo sign-in so the UI is testable.
    return ok(res, { user: { id: 'admin', email: email || 'admin' }, token: 'demo' }, 'Signed in (demo)');
  }
  fail(res, 'Invalid admin email or password', 401);
}

async function listTasks(res) {
  const rows = await sb('volunteer_tasks', { query: { select: '*', status: 'eq.open', order: 'priority.desc,created_at.desc', limit: '100' } });
  ok(res, rows || []);
}

async function myAssignments(res, q) {
  const vid = q.volunteer_id;
  if (!vid) return ok(res, []);
  const rows = await sb('volunteer_tasks', { query: { select: '*', assigned_volunteer_id: 'eq.' + vid, order: 'created_at.desc', limit: '100' } });
  ok(res, rows || []);
}

async function volunteerStats(res, q) {
  const vid = q.volunteer_id;
  let completed = 0;
  try { completed = await sbCount('volunteer_tasks', 'assigned_volunteer_id=eq.' + encodeURIComponent(vid) + '&status=eq.completed'); } catch (e) {}
  ok(res, { tasks_completed: completed, hours_served: completed * 4 });
}

async function claimTask(res, id, b) {
  const patch = { assigned_volunteer_id: b.volunteer_id || null, status: 'claimed', updated_at: nowIso() };
  const out = await sb('volunteer_tasks', { method: 'PATCH', query: { id: 'eq.' + id, select: '*' }, body: patch, prefer: 'return=representation' });
  ok(res, (out && out[0]) || patch, 'Task claimed');
}

async function taskProgress(res, id, b) {
  const patch = { status: b.status || 'in_progress', progress_note: b.progress_note || '', updated_at: nowIso() };
  if (b.status === 'completed') patch.completed_at = nowIso();
  const out = await sb('volunteer_tasks', { method: 'PATCH', query: { id: 'eq.' + id, select: '*' }, body: patch, prefer: 'return=representation' });
  ok(res, (out && out[0]) || patch, 'Progress saved');
}

async function adminOverview(res) {
  const [total, resolved, pending, vols] = await Promise.all([
    sbCount('help_requests', ''),
    sbCount('help_requests', 'status=eq.resolved'),
    sbCount('help_requests', 'status=eq.pending'),
    sbCount('volunteers', '')
  ]);
  const recent = await sb('help_requests', { query: { select: '*', order: 'created_at.desc', limit: '5' } }).catch(() => []);
  const alerts = await sb('alerts', { query: { select: '*', is_active: 'eq.true', limit: '50' } }).catch(() => []);
  ok(res, {
    total_requests: total,
    active_volunteers: vols,
    resolved,
    pending,
    recent_requests: (recent || []).map(r => ({
      id: String(r.id).slice(-4),
      category: CAT_LABEL[r.category] || r.category || 'Help',
      location: r.city || '—',
      status: ST_LABEL[r.status] || 'Pending'
    })),
    map_markers: alerts || []
  });
}

async function listShelters(res) {
  const rows = await sb('shelters', { query: { select: '*', type: 'neq.hospital', order: 'created_at.desc', limit: '100' } });
  ok(res, rows || []);
}

async function listHospitals(res) {
  const rows = await sb('shelters', { query: { select: '*', type: 'eq.hospital', limit: '100' } });
  const out = (rows || []).map(x => Object.assign({}, x, { beds_available: Math.max((x.capacity || 0) - (x.current_occupancy || 0), 0) }));
  ok(res, out);
}

/* ── Router ────────────────────────────────────────────── */
function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SB_URL || !SB_KEY) {
    return fail(res, 'Backend not configured: set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel env vars', 500);
  }

  const seg = [].concat(req.query.path || []);
  const q = Object.assign({}, req.query);
  delete q.path;
  const method = req.method;
  const b = readBody(req);

  try {
    const r0 = seg[0];
    if (r0 === 'help-requests') {
      if (method === 'POST') return await createHelpRequest(res, b);
      return await listHelpRequests(res, q);
    }
    if (r0 === 'auth') {
      if (seg[1] === 'register-role' && method === 'POST') return await registerRole(res, b);
      if (seg[1] === 'admin-signin' && method === 'POST') return await adminSignin(res, b);
      return fail(res, 'Unknown auth endpoint', 404);
    }
    if (r0 === 'tasks') {
      if (seg[1] === 'my-assignments') return await myAssignments(res, q);
      if (seg[1] === 'volunteer-stats') return await volunteerStats(res, q);
      if (seg[2] === 'claim' && method === 'POST') return await claimTask(res, seg[1], b);
      if (seg[2] === 'progress' && (method === 'PATCH' || method === 'POST')) return await taskProgress(res, seg[1], b);
      if (!seg[1]) return await listTasks(res);
      return fail(res, 'Unknown tasks endpoint', 404);
    }
    if (r0 === 'analytics' && seg[1] === 'admin-overview') return await adminOverview(res);
    if (r0 === 'shelters') return await listShelters(res);
    if (r0 === 'hospitals') return await listHospitals(res);

    return fail(res, 'Not found: /api/v1/' + seg.join('/'), 404);
  } catch (e) {
    return fail(res, 'Server error: ' + (e && e.message ? e.message : String(e)), 500);
  }
};
