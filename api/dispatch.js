/**
 * ReliefLink — Vercel Serverless API dispatcher (Node.js)
 * All /api/v1/* requests are rewritten here (see vercel.json) with the remaining
 * path passed as ?path=... . Talks to Supabase (PostgREST). No external deps.
 *
 * Env (set in Vercel project):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
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

// Last n month keys 'YYYY-MM', oldest first — used for growth/hours charts.
function monthKeys(n) {
  const out = [], d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0'));
  }
  return out;
}

async function sb(table, { method = 'GET', query, body, prefer } = {}) {
  let url = SB_URL + '/rest/v1/' + table;
  const params = new URLSearchParams();
  for (const k in (query || {})) { const v = query[k]; if (v != null) params.append(k, String(v)); }
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
const INCIDENT_CAT = { flood: 'rescue', earthquake: 'rescue', fire: 'rescue', storm: 'rescue', landslide: 'rescue', medical: 'medical', missing: 'special', other: 'special' };

async function createHelpRequest(res, b) {
  const desc = b.description || '';
  const intent = extractIntent(desc + ' ' + (b.incident_type || '') + ' ' + ((b.needs || []).join(' ')));
  const people = parseInt(b.people_count, 10) || intent.people_count || 0;
  const tri = triageScore(b.urgent ? 'critical' : (b.urgency || intent.urgency), people, intent.flags);
  // Duplicate detection: same phone number within the last 30 minutes
  let dup = false;
  if (b.phone) {
    try {
      const since = new Date(Date.now() - 30 * 60000).toISOString();
      const recent = await sb('help_requests', { query: { select: 'id', phone: 'eq.' + b.phone, created_at: 'gt.' + since, limit: '1' } });
      dup = !!(recent && recent.length);
    } catch (e) { /* non-fatal */ }
  }
  const row = {
    id: rid('RFL'), user_id: b.user_id || null, full_name: b.full_name || 'Citizen',
    phone: b.phone || '', city: b.city || '', category: b.category || INCIDENT_CAT[intent.incident_type] || 'special',
    description: desc + '\n[AI TRIAGE] score=' + tri.score + ' priority=' + tri.recommended + ' incident=' + intent.incident_type +
      ' needs=' + intent.needs.join(',') + ' people=' + (people || '?') + ' flags=' + (intent.flags.join('|') || '-') + (dup ? ' DUP_SUSPECT=1' : ''),
    urgency: tri.recommended,
    status: 'pending', latitude: b.latitude != null ? b.latitude : null,
    longitude: b.longitude != null ? b.longitude : null, created_at: nowIso(), updated_at: nowIso()
  };
  const out = await sb('help_requests', { method: 'POST', body: row, prefer: 'return=representation' });
  ok(res, Object.assign({}, (out && out[0]) || row, { ai_triage: tri, intent, duplicate_suspect: dup }), 'Request received');
}

async function listHelpRequests(res, q) {
  const limit = Math.min(parseInt(q.limit, 10) || 100, 500);
  const query = { select: '*', order: 'created_at.desc', limit: String(limit) };
  if (q.user_id) query.user_id = 'eq.' + q.user_id;
  ok(res, (await sb('help_requests', { query })) || []);
}

async function registerRole(res, b) {
  const uid = rid('usr');
  await sb('users', { method: 'POST', prefer: 'return=representation', body: { id: uid, full_name: b.full_name || 'User', phone: b.phone || '', email: b.email || null, role: b.role || 'citizen', city: b.city || null, created_at: nowIso(), updated_at: nowIso() } });
  if (b.role === 'volunteer') {
    await sb('volunteers', { method: 'POST', prefer: 'return=representation', body: { id: rid('vol'), user_id: uid, full_name: b.full_name || 'Volunteer', phone: b.phone || '', skills: b.skills || [], availability: b.availability || 'available', registered_at: nowIso() } });
  }
  ok(res, { user: { id: uid, full_name: b.full_name || 'User' } }, 'Registered');
}

async function adminSignin(res, b) {
  const wantEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const wantPw = process.env.ADMIN_PASSWORD || '';
  const email = (b.email || '').toLowerCase();
  if (wantEmail && wantPw) {
    if (email === wantEmail && b.password === wantPw) return ok(res, { user: { id: 'admin', email }, token: 'session-' + rid('tok') }, 'Signed in');
    return fail(res, 'Invalid admin email or password', 401);
  }
  // No admin credentials configured yet — demo sign-in so the dashboard is reachable.
  if (email && b.password) return ok(res, { user: { id: 'admin', email }, token: 'demo' }, 'Signed in (demo)');
  return fail(res, 'Enter your admin email and password', 400);
}

async function listTasks(res) {
  ok(res, (await sb('volunteer_tasks', { query: { select: '*', status: 'eq.open', order: 'priority.desc,created_at.desc', limit: '100' } })) || []);
}
async function myAssignments(res, q) {
  if (!q.volunteer_id) return ok(res, []);
  ok(res, (await sb('volunteer_tasks', { query: { select: '*', assigned_volunteer_id: 'eq.' + q.volunteer_id, order: 'created_at.desc', limit: '100' } })) || []);
}
async function volunteerStats(res, q) {
  let completed = 0;
  try { completed = await sbCount('volunteer_tasks', 'assigned_volunteer_id=eq.' + encodeURIComponent(q.volunteer_id || '') + '&status=eq.completed'); } catch (e) {}
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
  const [total, resolved, pending, vols, openTasks] = await Promise.all([
    sbCount('help_requests', ''), sbCount('help_requests', 'status=eq.resolved'),
    sbCount('help_requests', 'status=eq.pending'), sbCount('volunteers', ''),
    sbCount('volunteer_tasks', 'status=eq.open').catch(() => 0)
  ]);
  const recent = await sb('help_requests', { query: { select: '*', order: 'created_at.desc', limit: '5' } }).catch(() => []);
  const alerts = await sb('alerts', { query: { select: '*', is_active: 'eq.true', limit: '50' } }).catch(() => []);

  // ── Real volunteer / task analytics — each block degrades to null on failure ──
  let growth = null, hoursMonthly = null, hoursTotal = null, topVols = null,
    skills = null, avail = null, recentVols = null, availableNow = null;
  try {
    const V = (await sb('volunteers', { query: { select: 'id,full_name,skills,availability,verified,registered_at', order: 'registered_at.desc', limit: '500' } })) || [];
    const keys = monthKeys(12), per = {};
    keys.forEach(k => { per[k] = 0; });
    V.forEach(v => { const k = String(v.registered_at || '').slice(0, 7); if (k in per) per[k]++; });
    let run = 0; growth = keys.map(k => (run += per[k]));
    const sc = {}; V.forEach(v => (v.skills || []).forEach(s => { sc[s] = (sc[s] || 0) + 1; }));
    skills = Object.keys(sc).sort((a, b) => sc[b] - sc[a]).slice(0, 4).map(k => ({ name: k, count: sc[k] }));
    const av = {}; V.forEach(v => { const a = v.availability || 'available'; av[a] = (av[a] || 0) + 1; });
    avail = Object.keys(av).map(k => ({ name: k, count: av[k] }));
    availableNow = av.available || 0;
    recentVols = V.slice(0, 5).map(v => ({
      id: v.id, name: v.full_name || 'Volunteer',
      skills: (v.skills || []).join(', ') || 'General',
      availability: v.availability || 'available', verified: !!v.verified
    }));
  } catch (e) {}
  try {
    const T = (await sb('volunteer_tasks', { query: { select: 'assigned_volunteer_id,completed_at,updated_at', status: 'eq.completed', order: 'completed_at.desc', limit: '500' } })) || [];
    const keys = monthKeys(12), per = {};
    keys.forEach(k => { per[k] = 0; });
    T.forEach(t => { const k = String(t.completed_at || t.updated_at || '').slice(0, 7); if (k in per) per[k]++; });
    hoursMonthly = keys.map(k => per[k] * 4);
    hoursTotal = T.length * 4;
    const byVol = {}; T.forEach(t => { if (t.assigned_volunteer_id) byVol[t.assigned_volunteer_id] = (byVol[t.assigned_volunteer_id] || 0) + 1; });
    topVols = Object.keys(byVol).sort((a, b) => byVol[b] - byVol[a]).slice(0, 5)
      .map(k => ({ volunteer_id: k, tasks: byVol[k], hours: byVol[k] * 4 }));
    if (topVols.length) {
      const V2 = (await sb('volunteers', { query: { select: 'id,full_name', limit: '500' } }).catch(() => [])) || [];
      const nm = {}; V2.forEach(v => { nm[v.id] = v.full_name; });
      topVols.forEach(t => { t.name = nm[t.volunteer_id] || 'Volunteer'; });
    }
  } catch (e) {}

  ok(res, {
    total_requests: total, active_volunteers: vols, resolved, pending,
    open_tasks: openTasks, volunteers_available: availableNow, hours_total: hoursTotal,
    volunteer_growth: growth, hours_monthly: hoursMonthly, top_volunteers: topVols,
    skill_distribution: skills, availability: avail, recent_volunteers: recentVols,
    recent_requests: (recent || []).map(r => ({ id: String(r.id).slice(-4), category: CAT_LABEL[r.category] || r.category || 'Help', location: r.city || '—', status: ST_LABEL[r.status] || 'Pending' })),
    map_markers: alerts || []
  });
}

/* ── Alerts (admin broadcast → volunteer notifications) ── */
async function createAlert(res, b) {
  const title = (b.title || '').trim();
  if (!title) return fail(res, 'Alert title is required', 400);
  const row = {
    id: rid('alr'), title,
    disaster_type: b.disaster_type || 'flood',
    severity: b.severity || 'high',
    description: b.description || '',
    location_text: b.location_text || b.city || '',
    latitude: b.latitude != null ? +b.latitude : null,
    longitude: b.longitude != null ? +b.longitude : null,
    radius_km: b.radius_km != null ? +b.radius_km : null,
    is_active: true, created_at: nowIso(), updated_at: nowIso()
  };
  const out = await sb('alerts', { method: 'POST', body: row, prefer: 'return=representation' });
  ok(res, (out && out[0]) || row, 'Alert broadcast to volunteers');
}
async function listAlerts(res, q) {
  const query = { select: '*', order: 'created_at.desc', limit: String(Math.min(parseInt(q.limit, 10) || 50, 200)) };
  if (q.active === 'true') query.is_active = 'eq.true';
  ok(res, (await sb('alerts', { query })) || []);
}

/* ── Volunteers (admin roster + verification) ──────────── */
async function listVolunteers(res, q) {
  const query = { select: '*', order: 'registered_at.desc', limit: '200' };
  if (q.availability) query.availability = 'eq.' + q.availability;
  ok(res, (await sb('volunteers', { query })) || []);
}
async function verifyVolunteer(res, id) {
  const out = await sb('volunteers', { method: 'PATCH', query: { id: 'eq.' + id, select: 'id,verified' }, body: { verified: true }, prefer: 'return=representation' });
  ok(res, (out && out[0]) || { id: id, verified: true }, 'Volunteer verified');
}
async function listShelters(res) {
  ok(res, (await sb('shelters', { query: { select: '*', type: 'neq.hospital', order: 'created_at.desc', limit: '100' } })) || []);
}
async function listHospitals(res) {
  const rows = (await sb('shelters', { query: { select: '*', type: 'eq.hospital', limit: '100' } })) || [];
  ok(res, rows.map(x => Object.assign({}, x, { beds_available: Math.max((x.capacity || 0) - (x.current_occupancy || 0), 0) })));
}

/* ── Router ────────────────────────────────────────────── */
function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}

/* ── AI engines: triage, copilot, matching ─────────────── */
// Multilingual keyword engine (English / Urdu / Roman Urdu) — deterministic, no key needed.
const K = {
  water:     /paani|pani|water|flood|sel\b|siyabi|bah[ao]|doob|subk|dub|پانی|سیلاب|ڈوب/i,
  injured:   /zakhmi|injur|blood|bleed|chot|khoon|wound|زخمی|چوٹ|خون/i,
  trapped:   /phans|trapped|stuck|chat\b|chatt|roof|tarap|پھنس/i,
  medical:   /medical|ambulance|doctor|dard|tabiyat|bhari|sick|patient|pregnan|operation|oxygen|heart|طبی|اسبیتال|دل|آکسیجن/i,
  fire:      /\baag\b|fire|burn|lash\b|smoke|dhuain|flame|آگ|جل/i,
  storm:     /toofan|storm|cyclone|tez hawa|aandhi|heavy rain|tez barish|baarish|طوفان|بارش/i,
  quake:     /zalzala|earthquake|kamp|tremor|shaking|زلزلہ/i,
  landslide: /landslide|pahaad|pahad|rockfall|mountain.*slide/i,
  missing:   /missing|gum|kho gaya|kho gayi|nazar nahi|la pata|lost child|لاپتا|گم/i,
  children:  /bach|child|kid|minor|infant|bache|beta|beti|بچے/i,
  elderly:   /buzurg|elderly|dadi|nani|abu|ammi jan|old person|frail|disab|بوڑھے|کمزور/i,
  women:     /aurat|woman|female|khatoon|behen|mother|ladies|عورت|خاتون/i,
  urgent:    /urgent|foran|fauran|jaldi|critical|khatra|danger|immediately|abhi|mauth|death|dying|فوری|خطرہ/i,
  shelter:   /shelter|khanabados|rehne|camp\b|homeless|ghar toot|ghar gir|makan gir|پناہ|شیلٹر|کیمپ/i,
  food:      /khaana|khana|food|roti|meal|bhook|ration|clean water|کھانا|روٹی|بھوک/i,
  transport: /transport|gari|vehicle|nikalne|evacuat|relocate|move us|boat|kashi|bus|کشتی|نقل/i
};
const NUMWORD = { ek:1, do:2, teen:3, char:4, panj:5, panch:5, che:6, saat:7, aath:8, nau:9, das:10,
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };

function extractIntent(text) {
  text = String(text || '');
  const hit = (re) => re.test(text);
  let people = 0;
  const m = text.match(/(\d+)\s*(?:\+)?\s*(?:log|people|members|family|individual)/i);
  if (m) people = parseInt(m[1], 10) || 0;
  if (!people) {
    const w = text.match(/\b(ek|do|teen|char|panch|panj|che|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:log|people|members|persons|of us|bachay|children|individuals)/i);
    if (w) people = NUMWORD[w[1].toLowerCase()] || 0;
  }
  let incident = 'other';
  if (hit(K.quake)) incident = 'earthquake';
  else if (hit(K.fire)) incident = 'fire';
  else if (hit(K.landslide)) incident = 'landslide';
  else if (hit(K.water)) incident = 'flood';
  else if (hit(K.storm)) incident = 'storm';
  else if (hit(K.medical) || hit(K.injured)) incident = 'medical';
  else if (hit(K.missing)) incident = 'missing';
  const needs = [];
  if (hit(K.trapped) || (hit(K.water) && hit(K.transport))) needs.push('rescue');
  if (hit(K.transport) || hit(K.trapped)) needs.push('evacuation');
  if (hit(K.medical) || hit(K.injured)) needs.push('medical');
  if (hit(K.shelter)) needs.push('shelter');
  if (hit(K.food) || hit(K.water)) needs.push('food_water');
  if (hit(K.transport)) needs.push('transport');
  if (hit(K.missing)) needs.push('search');
  if (!needs.length) needs.push(hit(K.urgent) ? 'rescue' : 'assessment');
  const enteringHome = hit(K.water) && /house|ghar|home|makan|building|گھر|عمارت|floor|kamra|room/i.test(text);
  const danger = hit(K.trapped) || hit(K.injured) || hit(K.fire) || enteringHome || (hit(K.water) && hit(K.transport)) || (hit(K.medical) && (hit(K.children) || hit(K.elderly)));
  let urgency = danger ? (hit(K.children) || hit(K.elderly) || people >= 6 || hit(K.urgent) ? 'critical' : 'high')
    : hit(K.urgent) ? 'high' : 'medium';
  if ((needs.includes('rescue') || needs.includes('evacuation')) && urgency === 'medium') urgency = 'high';
  const flags = [];
  if (hit(K.trapped)) flags.push('trapped');
  if (hit(K.injured)) flags.push('injured');
  if (hit(K.children)) flags.push('children');
  if (hit(K.elderly)) flags.push('elderly');
  if (/pregnan/i.test(text)) flags.push('pregnant');
  return { incident_type: incident, needs: [...new Set(needs)], people_count: people, urgency, flags };
}

function triageScore(urgency, people, flags) {
  let s = { critical: 55, high: 40, medium: 20, low: 8 }[urgency] || 20;
  s += Math.min(20, (people || 0) * 3);
  if (flags.includes('trapped')) s += 15;
  if (flags.includes('injured')) s += 12;
  if (flags.includes('children')) s += 8;
  if (flags.includes('elderly')) s += 6;
  if (flags.includes('pregnant')) s += 8;
  s = Math.min(100, s);
  return { score: s, recommended: s >= 75 ? 'critical' : s >= 45 ? 'high' : s >= 25 ? 'medium' : 'low' };
}

const GUIDANCE = {
  flood: ['Move to the highest floor with essentials — do not walk or drive through moving water.', 'Switch off electricity at the mains before water enters.', 'Keep documents and medicine in a sealed bag on you.'],
  medical: ['Call an ambulance (115) or Rescue 1122 now — do not wait for the chat.', 'Do not move a seriously injured person unless they are in immediate danger.', 'Apply direct pressure on bleeding wounds with a clean cloth.'],
  fire: ['Get everyone out, stay low under smoke, do not use lifts.', 'Call Fire Brigade 16 and shut the gas supply if safe.', 'Do not re-enter for belongings.'],
  storm: ['Stay inside, away from windows; charge phones and keep a torch handy.', 'Avoid metal roofs, trees, and billboards; report damaged wires to 118.', 'Store drinking water — storms often contaminate supply.'],
  earthquake: ['Drop, Cover, Hold On — do not run during shaking.', 'After shaking: check gas and wiring before moving; expect aftershocks.', 'Do not use lifts; watch for cracked stairs and walls.'],
  landslide: ['Move away from the slope, uphill and to the sides — never straight down.', 'Report blocked roads so others can reroute.', 'Avoid riverbanks after slides — debris dams can burst.'],
  missing: ['Register a police report (15) with a recent photo and last-seen details.', 'Share the last known location with rescue teams, not on social media.', 'Keep a family member reachable at the reported number.'],
  other: ['Stay where you are if safe; note your nearest landmark.', 'Keep your phone charged and Rescue 1122 within reach.']
};
function nextQuestion(i) {
  if (!i.people_count) return 'Aapke saath kitne log hain? (How many people are with you?)';
  if (i.needs.includes('rescue') || i.needs.includes('evacuation')) return 'Kya aap log chat par hain ya phanse hue hain? (Are you on a rooftop or trapped?)';
  if (i.incident_type === 'medical') return 'Kya zakhmi hosh mein hain ya chal sakte hain? (Is the injured person conscious?)';
  if (i.incident_type === 'missing') return 'Akhri baar kab aur kahan nazar aaye? (When and where were they last seen?)';
  return 'Apna ilaaka / nearest landmark likh dein taake team theek jagah pohanche. (Enter your area or nearest landmark.)';
}

// Copilot: Groq LLM if GROQ_API_KEY env is set, otherwise the deterministic rule engine.
async function copilot(res, b) {
  const message = String(b.message || '').slice(0, 800);
  const rule = extractIntent(message);
  const tri = triageScore(rule.urgency, rule.people_count, rule.flags);
  if (process.env.GROQ_API_KEY && message) {
    try {
      const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', temperature: 0.3, response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are ReliefLink PK disaster copilot. From the citizen message (English/Urdu/Roman Urdu), reply ONLY JSON: {"incident_type":"flood|earthquake|fire|storm|landslide|medical|missing|other","needs":["rescue","evacuation","medical","shelter","food_water","transport","search","assessment"],"people_count":number,"urgency":"critical|high|medium|low","flags":["trapped","injured","children","elderly","pregnant"],"reply":"one short caring sentence in the SAME language as the user"}. Never invent facts.' },
            { role: 'user', content: message }
          ]
        })
      });
      if (gr.ok) {
        const gj = await gr.json();
        const j = JSON.parse(gj.choices[0].message.content);
        const i2 = { incident_type: j.incident_type || rule.incident_type, needs: (j.needs || rule.needs).slice(0, 4), people_count: +j.people_count || rule.people_count, urgency: j.urgency || rule.urgency, flags: (j.flags || rule.flags).slice(0, 5) };
        const t2 = triageScore(i2.urgency, i2.people_count, i2.flags);
        return ok(res, { engine: 'groq', intent: i2, triage: t2, guidance: GUIDANCE[i2.incident_type] || GUIDANCE.other, question: nextQuestion(i2), reply: j.reply || '', draft: { incident_type: i2.incident_type, needs: i2.needs, people_count: i2.people_count, urgency: i2.urgency, description: message } }, 'Copilot reply');
      }
    } catch (e) { /* fall through to rule engine */ }
  }
  const reply = 'Main ne aapki baat samajh li: ' + rule.incident_type.toUpperCase() +
    (rule.flags.length ? ' (' + rule.flags.join(', ') + ')' : '') + '. Emergency services ka intezar na karein — Rescue 1122 dabayein.';
  ok(res, { engine: 'rules', intent: rule, triage: tri, guidance: GUIDANCE[rule.incident_type] || GUIDANCE.other, question: nextQuestion(rule), reply, draft: { incident_type: rule.incident_type, needs: rule.needs, people_count: rule.people_count, urgency: rule.urgency, description: message } }, 'Copilot reply');
}

async function resourceMatch(res, q) {
  const lat = parseFloat(q.lat), lng = parseFloat(q.lng);
  const hasLoc = isFinite(lat) && isFinite(lng);
  const needs = String(q.needs || '').split(',').filter(Boolean);
  const dist = (a) => {
    if (!hasLoc || a.latitude == null) return null;
    const R = 6371, dp = Math.PI / 180;
    const s = Math.pow(Math.sin((a.latitude - lat) * dp / 2), 2) + Math.cos(lat * dp) * Math.cos(a.latitude * dp) * Math.pow(Math.sin((a.longitude - lng) * dp / 2), 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
  };
  const shelters = ((await sb('shelters', { query: { select: '*', status: 'eq.active', limit: '80' } })) || [])
    .map(x => Object.assign({}, x, { free_space: Math.max(0, (x.capacity || 0) - (x.current_occupancy || 0)), distance_km: dist(x) }))
    .filter(x => x.free_space > 0)
    .sort((x, y) => (x.distance_km == null ? 1e9 : x.distance_km) - (y.distance_km == null ? 1e9 : y.distance_km))
    .slice(0, 5);
  let vols = (await sb('volunteers', { query: { select: '*', availability: 'eq.available', verified: 'eq.true', limit: '120' } })) || [];
  if (needs.length) vols = vols.filter(v => (v.skills || []).some(sk => needs.some(n => String(sk).toLowerCase().includes(n.replace('_', ' ')))));
  vols = vols.map(x => Object.assign({}, x, { distance_km: dist(x) })).sort((x, y) => (x.distance_km == null ? 1e9 : x.distance_km) - (y.distance_km == null ? 1e9 : y.distance_km)).slice(0, 8);
  ok(res, { shelters, volunteers: vols, matched_needs: needs }, 'Resource matches');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const raw = req.query.path || '';
  const seg = (Array.isArray(raw) ? raw.join('/') : String(raw)).split('/').filter(Boolean);
  const q = Object.assign({}, req.query);
  delete q.path;
  const method = req.method;
  const b = readBody(req);

  // Admin sign-in and Copilot need no DB config — handle before the guard.
  if (seg[0] === 'auth' && seg[1] === 'admin-signin' && method === 'POST') return await adminSignin(res, b);
  if (seg[0] === 'ai' && seg[1] === 'copilot' && method === 'POST') return await copilot(res, b);

  if (!SB_URL || !SB_KEY) return fail(res, 'Backend not configured: set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel env vars', 500);

  try {
    const r0 = seg[0];
    if (r0 === 'matching') return await resourceMatch(res, q);
    if (r0 === 'help-requests') return method === 'POST' ? await createHelpRequest(res, b) : await listHelpRequests(res, q);
    if (r0 === 'auth') {
      if (seg[1] === 'register-role' && method === 'POST') return await registerRole(res, b);
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
    if (r0 === 'alerts') return method === 'POST' ? await createAlert(res, b) : await listAlerts(res, q);
    if (r0 === 'volunteers') {
      if (seg[1] && seg[2] === 'verify' && method === 'POST') return await verifyVolunteer(res, seg[1]);
      if (!seg[1]) return await listVolunteers(res, q);
      return fail(res, 'Unknown volunteers endpoint', 404);
    }
    if (r0 === 'shelters') return await listShelters(res);
    if (r0 === 'hospitals') return await listHospitals(res);
    return fail(res, 'Not found: /api/v1/' + seg.join('/'), 404);
  } catch (e) {
    return fail(res, 'Server error: ' + (e && e.message ? e.message : String(e)), 500);
  }
};
