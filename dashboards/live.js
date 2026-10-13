/**
 * ReliefLink — Live geo/weather/flood/map layer (dashboards/live.js)
 * 100% FREE, no API keys, no backend: Open-Meteo (weather + river discharge),
 * OpenStreetMap/Nominatim (geocoding), Leaflet (map), browser geolocation.
 * Every call degrades gracefully (returns null / no-ops on failure).
 */
window.RL_LIVE = (function () {

  // Pakistan cities -> [lat, lng]
  var PK = {
    'lahore': [31.5204, 74.3587], 'karachi': [24.8607, 67.0011], 'islamabad': [33.6844, 73.0479],
    'rawalpindi': [33.5651, 73.0169], 'multan': [30.1575, 71.5249], 'faisalabad': [31.4504, 73.135],
    'peshawar': [34.0151, 71.5249], 'quetta': [30.1798, 66.975], 'rajanpur': [29.1044, 70.3302],
    'muzaffargarh': [30.0703, 71.1933], 'layyah': [30.9693, 70.9428], 'jhang': [31.2681, 72.3181],
    'sukkur': [27.7052, 68.8574], 'charsadda': [34.1453, 71.7308], 'hyderabad': [25.396, 68.3578],
    'larkana': [27.5598, 68.2264], 'nowshera': [34.0153, 71.9747], 'gujranwala': [32.157, 74.1835],
    'sargodha': [32.0836, 72.6711], 'bahawalpur': [29.3977, 71.6752], 'sialkot': [32.5235, 74.5232],
    'abbottabad': [34.1463, 73.2222], 'mardan': [34.1974, 72.0487], 'dikho': [27.8796, 68.5815],
    'chitral': [35.8518, 71.7963], 'gilgit': [35.92, 74.31], 'muzzaffarabad': [34.3607, 73.4716]
  };

  function cap(s) { return (s || '').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function geo(city) {
    city = (city || '').toLowerCase();
    for (var k in PK) if (city.indexOf(k) > -1) return { lat: PK[k][0], lng: PK[k][1], name: cap(k) };
    return null;
  }
  function fetchJSON(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error('http' + r.status); return r.json(); });
  }

  function weather(lat, lng) {
    return fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng +
      '&current=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FKarachi&forecast_days=3');
  }
  function flood(lat, lng) {
    return fetchJSON('https://flood-api.open-meteo.com/v1/flood?latitude=' + lat + '&longitude=' + lng +
      '&daily=river_discharge&past_days=5&forecast_days=7');
  }
  function search(q) {
    return fetchJSON('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) +
      '&format=jsonv2&limit=1&countrycodes=pk');
  }
  function locate(cb) {
    if (!navigator.geolocation) return cb(null);
    navigator.geolocation.getCurrentPosition(
      function (p) { cb({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      function () { cb(null); }, { timeout: 9000, maximumAge: 300000 });
  }

  // Combine weather + river discharge into an honest flood-risk estimate.
  function risk(wx, fl) {
    var precip48 = 0;
    if (wx && wx.daily && wx.daily.precipitation_sum) {
      var p = wx.daily.precipitation_sum; precip48 = (p[0] || 0) + (p[1] || 0);
    }
    var dis = [], now = 0, maxFc = 0;
    if (fl && fl.daily && Array.isArray(fl.daily.river_discharge)) {
      dis = fl.daily.river_discharge;
      now = dis.length > 6 ? dis[5] : dis[0];
      maxFc = Math.max.apply(null, dis.slice(6).length ? dis.slice(6) : dis);
    }
    var pct = Math.round(Math.min(95,
      precip48 * 3 + Math.max(0, (maxFc - now)) * 1.2 +
      (maxFc > 150 ? 35 : maxFc > 50 ? 18 : maxFc > 10 ? 8 : 0)));
    var status = maxFc > 150 ? 'Above danger mark' : maxFc > 50 ? 'Elevated' : maxFc > 10 ? 'Normal' : 'Low';
    var trend = (now > 0.05 && maxFc > now * 1.3) ? 'Rising' : (now > 0.05 && maxFc < now * 0.8) ? 'Falling' : 'Steady';
    var rise = Math.max(0, maxFc - now);
    var confidence = Math.min(96, 60 + Math.round(precip48 * 2) + (dis.length ? 12 : 0));
    return { pct: pct, riverNow: +now.toFixed(2), riverMax: +maxFc.toFixed(2), precip48: +precip48.toFixed(1), status: status, trend: trend, rise: +rise.toFixed(2), confidence: confidence };
  }

  /* ── Leaflet map helpers ─────────────────────────────── */
  function map(id, lat, lng, zoom) {
    if (!window.L) return null;
    var el = document.getElementById(id); if (!el) return null;
    if (el._leaflet_id) { try { window.L.DomEvent.stop && 0; } catch (e) {} }
    var m = window.L.map(id).setView([lat, lng], zoom == null ? 8 : zoom);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    return m;
  }
  function marker(m, lat, lng, label, color) {
    if (!m || !window.L) return null;
    var mk = window.L.circleMarker([lat, lng], { radius: 7, color: color || '#2E7D32', weight: 2, fillColor: color || '#2E7D32', fillOpacity: 0.75 }).addTo(m);
    if (label) mk.bindPopup(label);
    return mk;
  }

  return { PK: PK, geo: geo, weather: weather, flood: flood, search: search, locate: locate, risk: risk, map: map, marker: marker, cap: cap };
})();
