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
  // Pakistan extent (Gwadar -> Khunjerab, eastern Sindh -> Gilgit-Baltistan).
  var PK_BOUNDS = [[23.6, 58.4], [37.3, 78.4]];
  function inPK(lat, lng) { return lat >= 23.6 && lat <= 37.3 && lng >= 58.4 && lng <= 78.4; }
  function clampPK(lat, lng) {
    return [Math.min(37.3, Math.max(23.6, lat)), Math.min(78.4, Math.max(58.4, lng))];
  }
  function nearest(lat, lng) {
    var best = null, bd = Infinity;
    for (var k in PK) {
      var d = Math.pow(PK[k][0] - lat, 2) + Math.pow(PK[k][1] - lng, 2);
      if (d < bd) { bd = d; best = { lat: PK[k][0], lng: PK[k][1], name: cap(k) }; }
    }
    return best || { lat: 29.1044, lng: 70.3302, name: 'Rajanpur' };
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
  // Longer window + explicit dates, for the flood-prediction graph.
  function floodSeries(lat, lng) {
    return fetchJSON('https://flood-api.open-meteo.com/v1/flood?latitude=' + lat + '&longitude=' + lng +
      '&daily=river_discharge&past_days=7&forecast_days=10&timezone=' + encodeURIComponent('Asia/Karachi'));
  }
  function rainSeries(lat, lng) {
    return fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng +
      '&daily=precipitation_sum,precipitation_probability_max&past_days=2&forecast_days=7&timezone=' + encodeURIComponent('Asia/Karachi'));
  }
  function search(q) {
    return fetchJSON('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) +
      '&format=jsonv2&limit=1&countrycodes=pk');
  }
  // Street-level reverse geocode (house number + road + area). zoom=18 = most detail.
  function reverse(lat, lng) {
    return fetchJSON('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng +
      '&format=jsonv2&zoom=18&addressdetails=1');
  }
  function fmtAddr(j) {
    if (!j) return '';
    var a = j.address || {};
    var line1 = (a.house_number ? a.house_number + (a.road ? ' ' : '') : '') + (a.road || a.neighbourhood || a.footway || a.block || '');
    var bits = [];
    if (line1.trim()) bits.push(line1.trim());
    bits.push(a.suburb || a.city_district || a.quarter || a.village || a.town || a.city || a.municipality || a.county);
    bits.push(a.state);
    bits = bits.filter(Boolean);
    if (!bits.length) return j.name || a.country || '';
    return bits.join(', ');
  }
  function locate(cb) {
    if (!navigator.geolocation) return cb(null);
    navigator.geolocation.getCurrentPosition(
      function (p) { cb({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      function () { cb(null); }, { timeout: 9000, maximumAge: 300000 });
  }

  /* ── Real distance between two {lat,lng} points (haversine, km) ── */
  function distKm(a, b) {
    var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  /* ── USGS earthquakes near a point — free, no key, last 30 days ── */
  function quakes(lat, lng, radiusKm) {
    var d = new Date(Date.now() - 30 * 864e5);
    var u = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=8&orderby=time' +
      '&latitude=' + lat + '&longitude=' + lng + '&maxradiuskm=' + (radiusKm || 350) +
      '&starttime=' + d.toISOString().slice(0, 10);
    return fetchJSON(u).then(function (j) {
      return ((j && j.features) || []).map(function (f) {
        return {
          mag: f.properties.mag, place: f.properties.place, time: f.properties.time,
          lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0]
        };
      }).filter(function (q) { return q.mag >= 2.5; });
    });
  }

  /* ── Multi-point weather (Open-Meteo accepts comma-separated coords) ── */
  function weatherAt(points) {
    var lats = points.map(function (p) { return p.lat; }).join(',');
    var lngs = points.map(function (p) { return p.lng; }).join(',');
    return fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=' + lats + '&longitude=' + lngs +
      '&current=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum&timezone=Asia%2FKarachi&forecast_days=2'
    ).then(function (j) { return Array.isArray(j) ? j : [j]; });
  }
  /* ── Multi-point river discharge (Open-Meteo flood API) ── */
  function floodAt(points) {
    var lats = points.map(function (p) { return p.lat; }).join(',');
    var lngs = points.map(function (p) { return p.lng; }).join(',');
    return fetchJSON('https://flood-api.open-meteo.com/v1/flood?latitude=' + lats + '&longitude=' + lngs +
      '&daily=river_discharge&past_days=2&forecast_days=5'
    ).then(function (j) { return Array.isArray(j) ? j : [j]; });
  }

  /* ── OSRM driving route: alternatives + turn-by-turn steps ── */
  function routeOSRM(from, to) {
    var u = 'https://router.project-osrm.org/route/v1/driving/' + from.lng + ',' + from.lat + ';' +
      to.lng + ',' + to.lat + '?overview=full&geometries=geojson&alternatives=2&steps=true';
    return fetchJSON(u).then(function (j) { return (j && j.code === 'Ok' && j.routes && j.routes.length) ? j.routes : null; });
  }

  /* ── Resolve a free-text place in Pakistan → {lat,lng,name} or null ── */
  function place(text) {
    text = (text || '').trim();
    if (!text) return Promise.resolve(null);
    var g = geo(text);
    if (g) return Promise.resolve(g);
    return search(text).then(function (r) {
      if (r && r.length && inPK(+r[0].lat, +r[0].lon))
        return { lat: +r[0].lat, lng: +r[0].lon, name: (r[0].display_name || '').split(',')[0] };
      return null;
    }).catch(function () { return null; });
  }

  // Combine weather + river discharge into an honest, location-calibrated flood-risk
  // estimate. NEVER fabricates: when no usable source returns, pct=null + uncertain=true.
  function _mean(a){ return a.length ? a.reduce(function(x,y){return x+y;},0)/a.length : 0; }
  function risk(wx, fl) {
    var nowD = new Date().toISOString().slice(0, 10);
    // Rainfall: Open-Meteo daily precipitation (mm). Use the forecast window from today forward, next 48h.
    var precip48 = 0, rainDays = 0;
    if (wx && wx.daily && Array.isArray(wx.daily.precipitation_sum) && Array.isArray(wx.daily.time)) {
      var t = wx.daily.time, p = wx.daily.precipitation_sum;
      for (var i = 0; i < t.length && rainDays < 2; i++) { if (t[i] >= nowD) { precip48 += (p[i] || 0); rainDays++; } }
    }
    var hasRain = rainDays > 0;
    // River discharge (GloFAS via Open-Meteo flood API, m³/s at this point's grid cell).
    // Calibrate against THIS location's own recent baseline, not one global threshold.
    var riverNow = 0, riverMax = 0, baseline = 0, ratio = 0, hasRiver = false;
    if (fl && fl.daily && Array.isArray(fl.daily.river_discharge) && Array.isArray(fl.daily.time)) {
      var rt = fl.daily.time, rd = fl.daily.river_discharge, past = [], fc = [];
      for (var k = 0; k < rt.length; k++) { var v = rd[k]; if (v == null || isNaN(v)) continue; (rt[k] < nowD ? past : fc).push(v); }
      if (fc.length) {
        hasRiver = true;
        riverMax = Math.max.apply(null, fc);
        riverNow = past.length ? past[past.length - 1] : fc[0];
        baseline = past.length >= 2 ? _mean(past) : (past.length === 1 ? past[0] : _mean(fc));
        ratio = baseline > 0.5 ? riverMax / baseline : 1;
      }
    }
    var usable = hasRain || hasRiver;
    if (!usable) {
      return { pct: null, uncertain: true, status: 'Data unavailable', trend: 'Unknown',
        riverNow: 0, riverMax: 0, precip48: 0, rise: 0, ratio: 0, confidence: 0,
        sources: { rain: false, river: false }, asOf: null,
        note: 'Live weather and river sources returned no data for this point — no risk value is estimated.' };
    }
    // River anomaly above the local baseline is the primary, calibrated signal (capped at 70).
    var riverScore = hasRiver ? Math.max(0, Math.min(70, (ratio - 1) * 45)) : 0;
    // Forecast rainfall adds flash-flood pressure (capped): ~25 mm/48h ≈ full 35 weight.
    var rainScore = hasRain ? Math.min(35, precip48 * 1.4) : 0;
    var pct = Math.max(0, Math.min(92, Math.round(riverScore + rainScore)));
    // Status word from the discharge ratio (relative to this reach's normal) — not a fake absolute danger mark.
    var status = !hasRiver ? 'No river gauge at this point'
      : ratio >= 1.6 ? 'Well above this reach\u2019s normal'
      : ratio >= 1.2 ? 'Above normal'
      : ratio >= 0.8 ? 'Near normal' : 'Below normal';
    var trend = !hasRiver ? 'Unknown'
      : (riverNow > 0.5 && riverMax > riverNow * 1.3) ? 'Rising'
      : (riverNow > 0.5 && riverMax < riverNow * 0.8) ? 'Falling' : 'Steady';
    var rise = hasRiver ? Math.max(0, riverMax - riverNow) : 0;
    // Confidence reflects source completeness + corroboration; capped at 85%, never 100%.
    var confidence = 0;
    if (hasRiver) confidence += 35;
    if (hasRain) confidence += 25;
    if (hasRiver && ratio >= 1.2) confidence += 10;   // a real measured anomaly raises certainty
    if (hasRiver && hasRain) confidence += 10;         // two independent sources agree
    confidence = Math.min(85, Math.max(20, confidence));
    return { pct: pct, uncertain: false, status: status, trend: trend,
      riverNow: +riverNow.toFixed(2), riverMax: +riverMax.toFixed(2),
      precip48: +precip48.toFixed(1), rise: +rise.toFixed(2), ratio: +ratio.toFixed(2),
      confidence: confidence, sources: { rain: hasRain, river: hasRiver },
      asOf: new Date().toISOString(),
      note: hasRiver ? ('River discharge here is ' + ratio.toFixed(2) + '\u00d7 its recent baseline (GloFAS grid cell, m\u00b3/s).')
                     : 'No river gauge cell here — estimate is rainfall-driven only (flash-flood signal).' };
  }

  /* ── Verified nearby facilities: OpenStreetMap (Overpass) + an optional caller registry.
       Distances are haversine-checked, coordinates validated inside Pakistan, and results
       are capped to a radius so a far-away place is NEVER presented as "nearest". ── */
  function nearestFacilities(lat, lng, opts) {
    opts = opts || {};
    var radiusKm = opts.radiusKm || 50, limit = opts.limit || 6;
    var self = { lat: lat, lng: lng };
    var registry = (opts.registry || []).map(function (x) {
      return { name: x.name, kind: x.kind, lat: +x.lat, lng: +x.lng, source: x.source || 'Registry' };
    });
    function finalize(all) {
      var seen = {}, out = [];
      (all || []).forEach(function (f) {
        if (f.lat == null || f.lng == null || isNaN(f.lat) || isNaN(f.lng)) return;   // drop unverified rows
        if (!inPK(f.lat, f.lng)) return;                                             // reject out-of-scope coords
        var d = distKm(self, { lat: f.lat, lng: f.lng });
        if (d > radiusKm) return;                                                    // never call a far place "nearest"
        var key = (f.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28);
        if (key && seen[key]) return; seen[key] = 1;
        f.km = d; out.push(f);
      });
      out.sort(function (a, b) { return a.km - b.km; });
      // Keep the nearest `limit` PER kind so a dense cluster of one type (e.g. shelters)
      // can never crowd out hospitals (or vice-versa) from the "nearest help" list.
      var perKind = {}, res = [];
      out.forEach(function (f) {
        var k = f.kind || 'Other';
        perKind[k] = (perKind[k] || 0);
        if (perKind[k] < limit) { perKind[k]++; res.push(f); }
      });
      res.sort(function (a, b) { return a.km - b.km; });
      return res;
    }
    var rM = Math.max(3000, Math.min(50000, radiusKm * 1000));
    // ONE combined Overpass request (hospital + shelter in a single union) halves the
    // load on the free endpoint and reduces throttle-failures versus two separate calls.
    return overpassFacilities(lat, lng, rM).then(function (osm) {
      return finalize(registry.concat(osm));
    }).catch(function () { return finalize(registry); });
  }

  /* ── Pakistan-wide live earthquake feed — USGS M4.5+ past week (compact, keyless) filtered to Pakistan + Hindu Kush ── */
  function quakesPK() {
    var u = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
    return fetchJSON(u).then(function (j) {
      return ((j && j.features) || []).map(function (f) {
        return { mag: +f.properties.mag, place: f.properties.place, time: f.properties.time,
          lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
      }).filter(function (q) { return q.lat >= 23 && q.lat <= 38 && q.lng >= 58 && q.lng <= 78; })
        .sort(function (a, b) { return b.time - a.time; }).slice(0, 40);
    });
  }

  /* ── Real nearby Points-of-Interest from OpenStreetMap (Overpass, keyless, mirror fallback) ── */
  var OPASS_MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
  /* ── Combined hospital + shelter query in one request — returns rows already tagged Hospital/Shelter ── */
  function overpassFacilities(lat, lng, radiusM) {
    var ar = '(around:' + (radiusM || 12000) + ',' + lat + ',' + lng + ')';
    var specs = [
      ['node', '["amenity"="hospital"]'], ['way', '["amenity"="hospital"]'],
      ['node', '["amenity"="shelter"]'], ['node', '["emergency"="shelter"]'],
      ['way', '["amenity"="shelter"]'], ['node', '["amenity"="community_centre"]']
    ];
    var body = specs.map(function (s) { return s[0] + s[1] + ar + ';'; }).join('');
    var data = '[out:json][timeout:25];(' + body + ');out center 40;';
    var i = 0;
    function tryOne() {
      if (i >= OPASS_MIRRORS.length) return Promise.resolve([]);
      return fetch(OPASS_MIRRORS[i++], { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(data) })
        .then(function (r) { if (!r.ok) throw new Error('http' + r.status); return r.json(); })
        .then(function (j) {
          return ((j && j.elements) || []).map(function (el) {
            var t = el.tags || {};
            var la = el.lat != null ? el.lat : (el.center && el.center.lat);
            var lo = el.lon != null ? el.lon : (el.center && el.center.lon);
            if (la == null || lo == null) return null;
            var isHosp = t.amenity === 'hospital';
            return { name: t.name || (isHosp ? 'Hospital' : 'Shelter'), kind: isHosp ? 'Hospital' : 'Shelter', lat: la, lng: lo, source: 'OpenStreetMap' };
          }).filter(Boolean);
        })
        .catch(tryOne);
    }
    return tryOne();
  }
  function opBody(kind, ar) {
    var specs = {
      hospital: [['node', '["amenity"="hospital"]'], ['way', '["amenity"="hospital"]']],
      clinic:   [['node', '["amenity"="clinic"]'], ['way', '["amenity"="clinic"]']],
      pharmacy: [['node', '["amenity"="pharmacy"]'], ['way', '["amenity"="pharmacy"]']],
      shelter:  [['node', '["amenity"="shelter"]'], ['node', '["emergency"="shelter"]'], ['way', '["amenity"="shelter"]'], ['node', '["amenity"="community_centre"]']]
    }[kind] || [];
    return specs.map(function (s) { return s[0] + s[1] + ar + ';'; }).join('');
  }
  function overpassPOI(lat, lng, radiusM, kind) {
    var ar = '(around:' + (radiusM || 12000) + ',' + lat + ',' + lng + ')';
    var data = '[out:json][timeout:20];(' + opBody(kind, ar) + ');out center 25;';
    var i = 0;
    function tryOne() {
      if (i >= OPASS_MIRRORS.length) return Promise.reject(new Error('overpass-unreachable')); /* all mirrors down — caller can show "busy, retry" instead of a misleading empty list */
      return fetch(OPASS_MIRRORS[i++], { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(data) })
        .then(function (r) { if (!r.ok) throw new Error('http' + r.status); return r.json(); })
        .then(function (j) {
          return ((j && j.elements) || []).map(function (el) {
            var t = el.tags || {};
            var la = el.lat != null ? el.lat : (el.center && el.center.lat);
            var lo = el.lon != null ? el.lon : (el.center && el.center.lon);
            return { kind: kind, name: t.name || (kind.charAt(0).toUpperCase() + kind.slice(1)),
              lat: la, lng: lo, addr: t['addr:street'] || t['addr:city'] || '', phone: t.phone || t['contact:phone'] || '' };
          }).filter(function (x) { return x.lat != null && x.lng != null; });
        })
        .catch(tryOne);
    }
    return tryOne();
  }

  /* ── Leaflet map helpers ─────────────────────────────── */
  function map(id, lat, lng, zoom) {
    if (!window.L) return null;
    var el = document.getElementById(id); if (!el) return null;
    var c = clampPK(lat, lng);
    var m = window.L.map(id, {
      maxBounds: PK_BOUNDS, maxBoundsVisualEffect: { strokeColor: '#2E7D32', strokeOpacity: 0.4, weight: 4 },
      minZoom: 5, maxZoom: 18, zoomSnap: 0.5, worldCopyJump: false
    }).setView(c, zoom == null ? 8 : zoom);
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

  return { PK: PK, PK_BOUNDS: PK_BOUNDS, geo: geo, weather: weather, flood: flood, floodSeries: floodSeries, rainSeries: rainSeries, search: search, reverse: reverse, fmtAddr: fmtAddr, locate: locate, risk: risk, nearestFacilities: nearestFacilities, map: map, marker: marker, cap: cap, inPK: inPK, clampPK: clampPK, nearest: nearest, distKm: distKm, quakes: quakes, quakesPK: quakesPK, overpassPOI: overpassPOI, weatherAt: weatherAt, floodAt: floodAt, routeOSRM: routeOSRM, place: place };
})();
