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
  var OPASS_MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
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
      if (i >= OPASS_MIRRORS.length) return Promise.resolve([]);
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

  return { PK: PK, PK_BOUNDS: PK_BOUNDS, geo: geo, weather: weather, flood: flood, floodSeries: floodSeries, rainSeries: rainSeries, search: search, reverse: reverse, fmtAddr: fmtAddr, locate: locate, risk: risk, map: map, marker: marker, cap: cap, inPK: inPK, clampPK: clampPK, nearest: nearest, distKm: distKm, quakes: quakes, quakesPK: quakesPK, overpassPOI: overpassPOI, weatherAt: weatherAt, floodAt: floodAt, routeOSRM: routeOSRM, place: place };
})();
