/**
 * ReliefLink – Shared Dashboard JS
 * shared.js · loaded by all 3 dashboards
 */
(function(){

/* ── ICON PATHS ── */
var P = {
  home:    'M3 11l9-8 9 8 M5 10v10h14V10',
  list:    'M9 6h12 M9 12h12 M9 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  plus:    'M12 5v14 M5 12h14',
  check:   'M20 6 9 17l-5-5',
  chart:   'M4 20V10 M10 20V4 M16 20v-8 M22 20H2',
  set:     'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  users:   'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M21 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  user:    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  bell:    'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
  inbox:   'M22 12h-6l-2 3h-4l-2-3H2 M5.5 5h13L22 12v7H2v-7z',
  bag:     'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  hosp:    'M3 21V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14 M15 11h5a1 1 0 0 1 1 1v9 M2 21h20 M9 9v6 M6 12h6',
  rescue:  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M5.6 5.6l3.9 3.9 M14.5 14.5l3.9 3.9 M18.4 5.6l-3.9 3.9 M9.5 14.5l-3.9 3.9',
  drop:    'M12 2.7s6 6.3 6 11.3a6 6 0 0 1-12 0c0-5 6-11.3 6-11.3z',
  pin:     'M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z M12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  clock:   'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  star:    'M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z',
  award:   'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M8.2 14 7 22l5-3 5 3-1.2-8',
  flame:   'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 2 3 1 0-2-1-4 0-7z',
  search:  'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.3-4.3',
  phone:   'M22 16.9a20.4 20.4 0 0 1-6.2 5.2 1 1 0 0 1-1-.1C7.1 17.5 5.8 9.1 5.1 6.2a1 1 0 0 1 .4-1A20.4 20.4 0 0 1 12 2a1 1 0 0 1 .8.4L17 7a1 1 0 0 1 0 1.3l-2.4 2.4a16 16 0 0 0 3.8 7.4l2.4-2.4a1 1 0 0 1 1.3 0l4.5 4.2a1 1 0 0 1 .1 1z',
  calendar:'M3 5h18v16H3z M16 3v4 M8 3v4 M3 10h18',
  shield:  'M12 2l7 4v6c0 5.2-4 9.6-7 11-3-1.4-7-5.8-7-11V6z',
  heart:   'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1.1-1a5.5 5.5 0 0 0 0-7.9z',
  car:     'M3 11h18M5 11V17h14V11 M7 17v2 M17 17v2 M4 11l4-6h8l4 6',
  tools:   'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3-3a6 6 0 0 1-7 7l-1.4 1.4a1 1 0 0 1-1.4 0L7 10.4a1 1 0 0 1 0-1.4L8.4 7.6a6 6 0 0 1 7-7z',
  mega:    'M3 11v2a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z M19 8a5 5 0 0 1 0 8',
  x:       'M18 6 6 18 M6 6l12 12',
  logout:  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  leaf:    'M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-3 16-9 16z M4 20c3-6 6-9 10-11',
  globe:   'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 2.6 3.9 5.7 3.9 9s-1.4 6.4-3.9 9c-2.5-2.6-3.9-5.7-3.9-9s1.4-6.4 3.9-9z',
  type:    'M4 7V5h16v2 M12 5v14 M9 19h6',
  eye:     'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  zap:     'M13 2 3 14h7l-1 8 11-14h-7z',
  arrowL:  'M19 12H5 M12 19l-7-7 7-7'
};

/** Build an SVG icon by name */
window.RL_Icon = function(n) {
  return P[n]
    ? '<svg class="i" viewBox="0 0 24 24"><path d="' + P[n] + '"/></svg>'
    : '';
};

/** Replace all <i data-i="name"> with the SVG */
window.RL_Icons = function() {
  document.querySelectorAll('i[data-i]').forEach(function(e) {
    var s = window.RL_Icon(e.dataset.i);
    if (s) e.outerHTML = s;
  });
};

/* ── DOM HELPER ── */
window.RL_$ = function(id) { return document.getElementById(id); };

/* ── TOAST ── */
window.RL_Toast = function(msg) {
  var t = window.RL_$('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2400);
};

/* ── INITIALS ── */
window.RL_Ini = function(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map(function(w) {
    return w[0] ? w[0].toUpperCase() : '';
  }).join('');
};

/* ── TAG HELPER ── */
window.RL_Tag = function(label, color) {
  return '<span class="tag" style="background:' + color + '22;color:' + color + '">' + label + '</span>';
};

/* ── MAKE CALL ── */
window.RL_Call = function(svc) { window.RL_Toast('Calling ' + svc + '…'); };

/* ── REAL DIAL — opens the phone dialer with a validated number ── */
window.RL_Tel = function(num) {
  var clean = String(num).replace(/[^\d+]/g, '');
  if (!clean) return;
  window.RL_Toast('Dialling ' + clean + '…');
  window.location.href = 'tel:' + clean;
};

/* ── MODAL ── */
window.RL_OpenModal  = function(id) { var el = window.RL_$(id); if (el) el.classList.add('open'); };
window.RL_CloseModal = function(id) { var el = window.RL_$(id); if (el) el.classList.remove('open'); };
window.RL_CloseModalOutside = function(e, id) { if (e.target === e.currentTarget) window.RL_CloseModal(id); };

/* ── MOBILE MENU ── */
window.RL_ToggleMenu = function() {
  var sb = window.RL_$('sidebar');
  var ov = window.RL_$('mobOverlay');
  if (sb) sb.classList.toggle('open');
  if (ov) ov.classList.toggle('open');
};

/* ── SESSION STORE (token + user set by the landing page sign-in) ── */
window.RL_Auth = {
  sess: function() {
    try {
      var s = localStorage.getItem('rl_session') || sessionStorage.getItem('rl_session');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  },
  token: function() { var s = window.RL_Auth.sess(); return (s && s.token) || ''; },
  user:  function() { var s = window.RL_Auth.sess(); return (s && s.user) || null; },
  set: function(d, remember) {
    try {
      if (!d || !d.token) return;
      var s = JSON.stringify({ token: d.token, user: d.user || {} });
      if (remember) { localStorage.setItem('rl_session', s); sessionStorage.removeItem('rl_session'); }
      else { sessionStorage.setItem('rl_session', s); localStorage.removeItem('rl_session'); }
      var u = d.user || {}, cur = {};
      if (u.full_name || u.phone) {
        try { cur = JSON.parse(localStorage.getItem('rl_user') || '{}') || {}; } catch (e) {}
        if (u.full_name) cur.name = u.full_name;
        if (u.phone) cur.phone = u.phone;
        if (u.city) cur.area = u.city;
        localStorage.setItem('rl_user', JSON.stringify(cur));
        sessionStorage.setItem('rl_user', JSON.stringify(cur));
      }
      if (d.volunteer && d.volunteer.id) localStorage.setItem('rl_vol_id', d.volunteer.id);
    } catch (e) {}
  },
  clear: function() { try { localStorage.removeItem('rl_session'); sessionStorage.removeItem('rl_session'); localStorage.removeItem('rl_vol_id'); } catch (e) {} }
};

/* ── LOGOUT ── */
window.RL_Logout = function() {
  try { sessionStorage.removeItem('rl_user'); localStorage.removeItem('rl_user'); } catch(e) {}
  window.RL_Auth.clear();
  window.location.href = '../index.html';
};

/* ── AUTH GATE — dashboards need a signed-in session when the API is live.
   Without a configured API the dashboards keep working in demo mode. ── */
window.RL_RequireAuth = function(role) {
  if (!window.RL_API) return true;                 // demo/static preview — no server to authenticate against
  var s = window.RL_Auth.sess();
  if (s && s.token) return true;
  var back = role === 'volunteer' ? '../index.html#signin' : '../index.html#help';
  try {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#16231c;color:#fff;padding:12px 18px;border-radius:12px;font-size:13px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    t.textContent = 'Session expired — please sign in again';
    document.body.appendChild(t);
  } catch (e) {}
  setTimeout(function() { window.location.href = back; }, 900);
  return false;
};

/* ── /auth/me refresh — keeps name/phone/volunteer id current ── */
window.RL_RefreshMe = function() {
  if (!window.RL_API || !window.RL_Auth.token()) return Promise.resolve(null);
  return window.RL_Get('/auth/me').then(function(d) {
    if (!d || !d.user) return null;
    try {
      var cur = {};
      try { cur = JSON.parse(localStorage.getItem('rl_user') || '{}') || {}; } catch (e) {}
      if (d.user.full_name) cur.name = d.user.full_name;
      if (d.user.phone) cur.phone = d.user.phone;
      if (d.user.city) cur.area = d.user.city;
      localStorage.setItem('rl_user', JSON.stringify(cur));
      sessionStorage.setItem('rl_user', JSON.stringify(cur));
      if (d.volunteer && d.volunteer.id) localStorage.setItem('rl_vol_id', d.volunteer.id);
      // refresh stored session user too
      var s = window.RL_Auth.sess();
      if (s) { s.user = d.user; (localStorage.getItem('rl_session') ? localStorage : sessionStorage).setItem('rl_session', JSON.stringify(s)); }
    } catch (e) {}
    return d;
  });
};

/* ── USER BOOT ── */
window.RL_GetUser = function() {
  var u = null;
  try { u = JSON.parse(sessionStorage.getItem('rl_user') || localStorage.getItem('rl_user')); } catch(e) {}
  return u;
};

window.RL_BootUser = function(opts) {
  // opts: { defaultName, defaultRole, roleLabel }
  var u = window.RL_GetUser() || {};
  var n = u.name || opts.defaultName || 'User';
  var av = window.RL_Ini(n) || opts.defaultName.slice(0,2).toUpperCase();
  // sidebar
  var sa = window.RL_$('sideAv'), sn = window.RL_$('sideName');
  if (sa) sa.textContent = av;
  if (sn) sn.textContent = n;
  // topbar
  var ta = window.RL_$('topAv'), tn = window.RL_$('topName');
  if (ta) ta.textContent = av;
  if (tn) tn.textContent = n;
  // profile page
  var pa = window.RL_$('profAv'), pn = window.RL_$('profName'), pnf = window.RL_$('profNameFull');
  if (pa) pa.textContent = av;
  if (pn) pn.textContent = n;
  if (pnf) pnf.textContent = n;
  if (window.RL_$('profPhone') && u.phone) window.RL_$('profPhone').textContent = u.phone;
  if (window.RL_$('profCity')  && u.city)  window.RL_$('profCity').textContent  = u.city;
  if (window.RL_$('profArea')  && u.area)  window.RL_$('profArea').textContent  = u.area;
  if (window.RL_$('profSkill') && u.skill) window.RL_$('profSkill').textContent = u.skill;
  return u;
};

/* ── PAGE NAVIGATOR ── */
window.RL_Navigate = function(page, pages, onAfter) {
  Object.keys(pages).forEach(function(k) {
    var el = window.RL_$('page-' + k);
    if (el) el.classList.toggle('hide', k !== page);
  });
  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.toggle('active', b.dataset.page === page);
  });
  var parts = (pages[page] || '|').split('|');
  var pt = window.RL_$('pageTitle'), ps = window.RL_$('pageSub');
  if (pt) pt.textContent = parts[0];
  if (ps) ps.textContent = parts[1] || '';
  if (typeof onAfter === 'function') onAfter(page);
  window.scrollTo(0, 0);
};

/* ── WIRE NAV ITEMS ── */
window.RL_WireNav = function(pages, onAfter) {
  document.querySelectorAll('.nav-item').forEach(function(b) {
    if (b.tagName === 'A') return; // plain links (e.g. Settings page) navigate normally
    b.addEventListener('click', function() {
      window.RL_Navigate(b.dataset.page, pages, onAfter);
      if (window.innerWidth <= 900) window.RL_ToggleMenu();
    });
  });
  // mobile overlay close
  var ov = window.RL_$('mobOverlay');
  if (ov) ov.addEventListener('click', window.RL_ToggleMenu);
};

/* ── SHARED DONUT CHART ── */
window.RL_Donut = function(id, data, total, size) {
  var sz = size || 130, off = 0, total2 = data.reduce(function(a, x) { return a + x[1]; }, 0);
  var s = '<svg viewBox="0 0 42 42" width="' + sz + '" height="' + sz + '">'
        + '<g fill="none" stroke-width="6" transform="rotate(-90 21 21)">'
        + '<circle cx="21" cy="21" r="15.9" stroke="#8884" stroke-opacity=".2"/>';
  data.forEach(function(x) {
    var v = x[1] / total2 * 100;
    s += '<circle cx="21" cy="21" r="15.9" stroke="' + x[2] + '"'
       + ' stroke-dasharray="' + (v - 1) + ' ' + (101 - v) + '"'
       + ' stroke-dashoffset="' + (-off) + '"/>';
    off += v;
  });
  s += '</g><text x="21" y="23.5" text-anchor="middle" font-size="7" font-weight="800" fill="currentColor">' + total + '</text></svg>'
     + '<div class="legend">'
     + data.map(function(x) {
         return '<div><span class="dot" style="background:' + x[2] + '"></span>' + x[0] + '<b>' + x[1] + '</b></div>';
       }).join('')
     + '</div>';
  var el = window.RL_$(id);
  if (el) el.innerHTML = s;
};

/* ── SHARED BAR CHART ── */
window.RL_Bars = function(id, values, labels, color) {
  var C = color || '#7C6CF0', w = 300, h = 140;
  var max = Math.max.apply(null, values);
  var s = '<svg viewBox="0 0 ' + w + ' ' + (h + 18) + '" width="100%">';
  for (var g = 0; g < 4; g++)
    s += '<line x1="0" x2="' + w + '" y1="' + (g * 40 + 5) + '" y2="' + (g * 40 + 5) + '" stroke="#8883" stroke-dasharray="3 4"/>';
  var bw = w / values.length;
  values.forEach(function(v, i) {
    var x = i * bw + 3, h2 = (v / max) * (h - 10);
    s += '<rect x="' + x + '" y="' + (h - h2) + '" width="' + (bw * .65) + '" height="' + h2 + '" rx="4" fill="' + C + '" opacity=".85"/>';
    if (labels && labels[i])
      s += '<text x="' + (x + bw * .3) + '" y="' + (h + 14) + '" font-size="8" fill="#999" text-anchor="middle">' + labels[i] + '</text>';
  });
  var el = window.RL_$(id);
  if (el) el.innerHTML = s + '</svg>';
};

/* ── SHARED LINE CHART ── */
window.RL_Line = function(id, data, color) {
  var C = color || '#7C6CF0', w = 300, h = 120;
  var mn = Math.min.apply(null, data) * .95, mx = Math.max.apply(null, data) * 1.02;
  var pts = data.map(function(v, i) {
    return [10 + i * (w - 20) / (data.length - 1), h - (v - mn) / (mx - mn) * (h - 10)];
  });
  var p = pts.map(function(q) { return q.join(','); }).join(' ');
  var labels = 'JFMAMJJASOND'.split('').slice(0, data.length);
  var s = '<svg viewBox="0 0 ' + w + ' ' + (h + 18) + '" width="100%">'
        + '<defs><linearGradient id="lg_' + id + '" x1="0" y1="0" x2="0" y2="1">'
        + '<stop offset="0" stop-color="' + C + '" stop-opacity=".35"/>'
        + '<stop offset="1" stop-color="' + C + '" stop-opacity="0"/></linearGradient></defs>';
  for (var g = 0; g < 4; g++)
    s += '<line x1="0" x2="' + w + '" y1="' + (g * 38 + 5) + '" y2="' + (g * 38 + 5) + '" stroke="#8883" stroke-dasharray="3 4"/>';
  s += '<polygon points="10,' + h + ' ' + p + ' ' + (w - 10) + ',' + h + '" fill="url(#lg_' + id + ')"/>'
     + '<polyline points="' + p + '" fill="none" stroke="' + C + '" stroke-width="2.5" stroke-linejoin="round"/>';
  pts.forEach(function(q, i) {
    if (i % 3 === 2 || i === data.length - 1)
      s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" fill="#fff" stroke="' + C + '" stroke-width="2"/>';
    s += '<text x="' + q[0] + '" y="' + (h + 14) + '" font-size="8" fill="#999" text-anchor="middle">' + (labels[i] || '') + '</text>';
  });
  var el = window.RL_$(id);
  if (el) el.innerHTML = s + '</svg>';
};

/* ═══════════════════════════════════════════
   LIVE API LAYER — connects dashboards to the
   FastAPI backend. Every call degrades gracefully:
   on any failure the dashboard keeps its demo data.
═══════════════════════════════════════════ */
window.RL_API = (window.RELIEF_API || '').replace(/\/$/, '');

function _withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise(function(_, rj) { setTimeout(function() { rj(new Error('timeout')); }, ms || 8000); })
  ]);
}

function _rlAuthHeader() {
  var tk = window.RL_Auth ? window.RL_Auth.token() : '';
  return tk ? { 'Authorization': 'Bearer ' + tk } : {};
}

/* GET → resolves to response .data (or null when unavailable) */
window.RL_Get = function(path) {
  if (!window.RL_API) return Promise.resolve(null);
  return _withTimeout(
    fetch(window.RL_API + path, { headers: _rlAuthHeader() }).then(function(r) {
      if (!r.ok) throw new Error('http' + r.status);
      return r.json();
    })
  ).then(function(j) { return (j && j.success) ? j.data : null; })
   .catch(function() { return null; });
};

/* POST / PATCH → resolves to response .data (or null) */
window.RL_Send = function(method, path, body) {
  if (!window.RL_API) return Promise.resolve(null);
  var hd = { 'Content-Type': 'application/json' };
  var ah = _rlAuthHeader(); for (var k in ah) hd[k] = ah[k];
  return _withTimeout(
    fetch(window.RL_API + path, {
      method: method,
      headers: hd,
      body: JSON.stringify(body || {})
    }).then(function(r) {
      return r.json().catch(function() { return {}; }).then(function(j) {
        return { ok: r.ok, status: r.status, data: (j && j.success) ? j.data : null, message: j && j.message };
      });
    })
  ).catch(function() { return { ok: false, status: 0, data: null }; });
};

/* ── Category mapping (mockup label ↔ backend enum key) ── */
window.RL_CAT_LABEL2KEY = {
  'Emergency Rescue & Evacuation': 'rescue',
  'Medical Assistance': 'medical',
  'Food & Clean Water': 'food',
  'Shelter & Accommodation': 'shelter',
  'Clothing & Supplies': 'clothing',
  'Clothing & Essential Supplies': 'clothing',
  'Transportation & Relocation': 'transport',
  'Sanitation & Hygiene': 'sanitation',
  'Special Assistance': 'special',
  'Home & Damage Recovery': 'recovery',
  'Missing Persons': 'missing',
  'Psychological Support': 'psychological',
  'Emotional & Psychological Support': 'psychological',
  'AI Flood Predictor': 'flood_predictor'
};
window.RL_CAT_KEY2LABEL = {
  rescue: 'Emergency Rescue & Evacuation', medical: 'Medical Assistance',
  food: 'Food & Clean Water', shelter: 'Shelter & Accommodation',
  clothing: 'Clothing & Supplies', transport: 'Transportation & Relocation',
  sanitation: 'Sanitation & Hygiene', special: 'Special Assistance',
  recovery: 'Home & Damage Recovery', missing: 'Missing Persons',
  psychological: 'Psychological Support', flood_predictor: 'AI Flood Predictor'
};
window.RL_CAT_EMOJI = {
  rescue: '', medical: '', food: '', shelter: '', clothing: '',
  transport: '', sanitation: '', special: '', recovery: '',
  missing: '', psychological: '', flood_predictor: ''
};
/* Help request status → step index (0-3) matching the tracker UI */
window.RL_HELP_STEP = { pending: 0, assigned: 1, in_progress: 2, resolved: 3 };
window.RL_HELP_TAG  = { pending: 'tag-blue', assigned: 'tag-yellow', in_progress: 'tag-orange', resolved: 'tag-green' };

/* ── Persistent local ids so dashboards can scope live calls ── */
window.RL_MyId = function(key) {
  var id = null;
  try { id = localStorage.getItem(key); if (!id) { id = key + '-' + Math.random().toString(36).slice(2, 8); localStorage.setItem(key, id); } } catch (e) { id = key + '-demo'; }
  return id;
};

/* ── DEVICE PREFERENCES (saved locally, applied on every page — no floating widget) ── */
window.RL_Prefs = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ═══════════════════════════════════════════
   AI TRIAGE ENGINE — deterministic, multilingual (English / Urdu / Roman Urdu).
   Front-end port of the backend intent + scoring engine so triage works even
   when the server / LLM is unreachable. Exposed as window.RL_AI.
═══════════════════════════════════════════ */
var K = {
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
var NUMWORD = { ek:1, do:2, teen:3, char:4, panj:5, panch:5, che:6, saat:7, aath:8, nau:9, das:10,
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };

function extractIntent(text) {
  text = String(text || '');
  var hit = function (re) { return re.test(text); };
  var people = 0;
  var m = text.match(/(\d+)\s*(?:\+)?\s*(?:log|people|members|family|individual)/i);
  if (m) people = parseInt(m[1], 10) || 0;
  if (!people) {
    var w = text.match(/\b(ek|do|teen|char|panch|panj|che|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:log|people|members|persons|of us|bachay|children|individuals)/i);
    if (w) people = NUMWORD[w[1].toLowerCase()] || 0;
  }
  var incident = 'other';
  if (hit(K.quake)) incident = 'earthquake';
  else if (hit(K.fire)) incident = 'fire';
  else if (hit(K.landslide)) incident = 'landslide';
  else if (hit(K.water)) incident = 'flood';
  else if (hit(K.storm)) incident = 'storm';
  else if (hit(K.medical) || hit(K.injured)) incident = 'medical';
  else if (hit(K.missing)) incident = 'missing';
  var needs = [];
  if (hit(K.trapped) || (hit(K.water) && hit(K.transport))) needs.push('rescue');
  if (hit(K.transport) || hit(K.trapped)) needs.push('evacuation');
  if (hit(K.medical) || hit(K.injured)) needs.push('medical');
  if (hit(K.shelter)) needs.push('shelter');
  if (hit(K.food) || hit(K.water)) needs.push('food_water');
  if (hit(K.transport)) needs.push('transport');
  if (hit(K.missing)) needs.push('search');
  if (!needs.length) needs.push(hit(K.urgent) ? 'rescue' : 'assessment');
  var enteringHome = hit(K.water) && /house|ghar|home|makan|building|گھر|عمارت|floor|kamra|room/i.test(text);
  var danger = hit(K.trapped) || hit(K.injured) || hit(K.fire) || enteringHome || (hit(K.water) && hit(K.transport)) || (hit(K.medical) && (hit(K.children) || hit(K.elderly)));
  var urgency = danger ? ((hit(K.children) || hit(K.elderly) || people >= 6 || hit(K.urgent)) ? 'critical' : 'high')
    : hit(K.urgent) ? 'high' : 'medium';
  if ((needs.indexOf('rescue') > -1 || needs.indexOf('evacuation') > -1) && urgency === 'medium') urgency = 'high';
  var flags = [];
  if (hit(K.trapped)) flags.push('trapped');
  if (hit(K.injured)) flags.push('injured');
  if (hit(K.children)) flags.push('children');
  if (hit(K.elderly)) flags.push('elderly');
  if (/pregnan/i.test(text)) flags.push('pregnant');
  return { incident_type: incident, needs: needs.filter(function (x, i) { return needs.indexOf(x) === i; }), people_count: people, urgency: urgency, flags: flags };
}

function triageScore(urgency, people, flags) {
  flags = flags || [];
  var s = { critical: 55, high: 40, medium: 20, low: 8 }[urgency] || 20;
  s += Math.min(20, (people || 0) * 3);
  if (flags.indexOf('trapped') > -1) s += 15;
  if (flags.indexOf('injured') > -1) s += 12;
  if (flags.indexOf('children') > -1) s += 8;
  if (flags.indexOf('elderly') > -1) s += 6;
  if (flags.indexOf('pregnant') > -1) s += 8;
  s = Math.min(100, s);
  return { score: s, recommended: s >= 75 ? 'critical' : s >= 45 ? 'high' : s >= 25 ? 'medium' : 'low' };
}

window.RL_AI = {
  /* Full analysis: intent + triage score + colour + human summary (EN). */
  analyze: function (text) {
    var intent = extractIntent(text);
    var triage = triageScore(intent.urgency, intent.people_count, intent.flags);
    return { intent: intent, triage: triage, color: window.RL_AI.sevColor(triage.recommended), label: window.RL_AI.sevLabel(triage.recommended) };
  },
  /* Force critical when the citizen themselves ticked "urgent". */
  applyUrgentFlag: function (res, isUrgent) {
    if (!res) return res;
    if (isUrgent) {
      if (res.triage.recommended === 'medium' || res.triage.recommended === 'low') {
        res.triage = { score: Math.max(res.triage.score, 60), recommended: 'high' };
      } else if (res.triage.recommended === 'high') {
        res.triage = { score: Math.max(res.triage.score, 78), recommended: 'critical' };
      }
      res.color = window.RL_AI.sevColor(res.triage.recommended);
      res.label = window.RL_AI.sevLabel(res.triage.recommended);
    }
    return res;
  },
  sevColor: function (u) { return { critical: '#EF5B5B', high: '#F58A3D', medium: '#F5B83D', low: '#3CC08E' }[u] || '#F5B83D'; },
  sevLabel: function (u) { return { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' }[u] || 'MEDIUM'; },
  NEED_LABEL: { rescue: 'Rescue', evacuation: 'Evacuation', medical: 'Medical', shelter: 'Shelter', food_water: 'Food & Water', transport: 'Transport', search: 'Search', assessment: 'Assessment' }
};

/* ── TEXT SIZE (small / medium / large — applied everywhere, remembered on device) ── */
window.RL_TextSize = function (size) {
  if (size === undefined) {                       // getter
    var s = window.RL_Prefs.get('rl_text', null);
    if (s === null) {                             // migrate legacy rl_big (0 normal · 1/2 bara)
      var old = window.RL_Prefs.get('rl_big', '0');
      s = (old === '1' || old === '2') ? 'large' : 'medium';
      window.RL_Prefs.set('rl_text', s);
    }
    return s === 'small' || s === 'large' ? s : 'medium';
  }
  if (size === true) size = 'large'; else if (size === false) size = 'medium';
  if (size === '0') size = 'medium'; else if (size === '1' || size === '2') size = 'large';
  if (size !== 'small' && size !== 'large') size = 'medium';
  window.RL_Prefs.set('rl_text', size);
  document.body.classList.toggle('text-small', size === 'small');
  document.body.classList.toggle('text-large', size === 'large');
  var bs = document.querySelectorAll('.rl-size-btn');
  for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', bs[i].getAttribute('data-size') === size);
  return size;
};

/* ── ACCESSIBILITY: high contrast + reduce motion ── */
window.RL_HighContrast = function (on) {
  if (on === undefined) return window.RL_Prefs.get('rl_hc', '0') === '1';
  on = !!on;
  window.RL_Prefs.set('rl_hc', on ? '1' : '0');
  document.body.classList.toggle('hc', on);
  return on;
};
window.RL_ReduceMotion = function (on) {
  if (on === undefined) return window.RL_Prefs.get('rl_motion', '0') === '1';
  on = !!on;
  window.RL_Prefs.set('rl_motion', on ? '1' : '0');
  document.body.classList.toggle('rm', on);
  return on;
};

/* ── NOTIFICATIONS preference (asks the browser for permission when turned on) ── */
window.RL_Notifs = function (on) {
  if (on === undefined) return window.RL_Prefs.get('rl_notif', '0') === '1';
  on = !!on;
  window.RL_Prefs.set('rl_notif', on ? '1' : '0');
  if (on && ('Notification' in window) && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch (e) {}
  }
  return on;
};

/* ── APPLY SAVED PREFERS on every page load ── */
document.addEventListener('DOMContentLoaded', function () {
  window.RL_TextSize(window.RL_TextSize());          // apply saved size + sync any UI
  window.RL_HighContrast(window.RL_HighContrast());  // apply saved a11y modes
  window.RL_ReduceMotion(window.RL_ReduceMotion());
  window.RL_Lang();                                  // apply saved language
  try { window.RL_RefreshMe(); } catch (e) {}        // silent session refresh (name/phone/vol id)
});

/* ── APP LANGUAGE (English / Urdu / Roman Urdu) ──
   Pages define window.RL_LANGDICT = { key: {en, ur, roman} } before shared.js loads.
   Elements opt in with data-rl="key" (text) or data-rl-ph="key" (placeholder). */
window.RL_Lang = function (lang) {
  if (lang) { try { localStorage.setItem('rl_lang', lang); } catch (e) {} }
  var cur = '';
  try { cur = localStorage.getItem('rl_lang') || 'en'; } catch (e) { cur = 'en'; }
  cur = cur === 'ur' || cur === 'roman' ? cur : 'en';
  var D = window.RL_LANGDICT || {};
  document.querySelectorAll('[data-rl]').forEach(function (el) {
    var k = el.getAttribute('data-rl'), e = D[k];
    if (!e) return;
    if (el.querySelector('input,select,textarea')) return; // never wipe form controls
    if (cur === 'en') { if (e.en != null) el.textContent = e.en; }
    else if (cur === 'ur') { if (e.ur != null) el.textContent = e.ur; el.setAttribute('dir', 'rtl'); }
    else { if (e.roman != null) el.textContent = e.roman; }
  });
  document.querySelectorAll('[data-rl-ph]').forEach(function (el) {
    var k = el.getAttribute('data-rl-ph'), e = D[k];
    if (!e) return;
    var v = cur === 'en' ? e.ph_en : cur === 'ur' ? e.ph_ur : e.ph_roman;
    if (v != null) el.setAttribute('placeholder', v);
  });
  var sel = document.getElementById('rlLangSel');
  if (sel) sel.value = cur;
  var lb = document.querySelectorAll('.rl-lang-btn');
  for (var j = 0; j < lb.length; j++) lb[j].classList.toggle('on', lb[j].getAttribute('data-lang') === cur);
  document.documentElement.setAttribute('lang', cur === 'ur' ? 'ur' : 'en');
  return cur;
};

})();

