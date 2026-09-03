"""
ReliefLink — Travel Safety Router

POST /check   — Check route safety between two Pakistan cities/locations
GET  /cities  — List of supported Pakistan cities with coordinates
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import math

from app.services.weather_service import weather_service
from app.utils.common import now_iso

router = APIRouter()

# ─── Pakistan Cities Database ────────────────────────────────
# Major cities and towns with coordinates
PAKISTAN_CITIES = {
    # Punjab
    "lahore":       {"lat": 31.5204, "lng": 74.3587, "label": "Lahore", "province": "Punjab"},
    "kasur":        {"lat": 31.1167, "lng": 74.4500, "label": "Kasur", "province": "Punjab"},
    "faisalabad":   {"lat": 31.4504, "lng": 73.1350, "label": "Faisalabad", "province": "Punjab"},
    "rawalpindi":   {"lat": 33.5651, "lng": 73.0169, "label": "Rawalpindi", "province": "Punjab"},
    "gujranwala":   {"lat": 32.1617, "lng": 74.1883, "label": "Gujranwala", "province": "Punjab"},
    "sialkot":      {"lat": 32.4945, "lng": 74.5229, "label": "Sialkot", "province": "Punjab"},
    "multan":       {"lat": 30.1575, "lng": 71.5249, "label": "Multan", "province": "Punjab"},
    "bahawalpur":   {"lat": 29.3956, "lng": 71.6836, "label": "Bahawalpur", "province": "Punjab"},
    "sargodha":     {"lat": 32.0836, "lng": 72.6711, "label": "Sargodha", "province": "Punjab"},
    "sheikhupura":  {"lat": 31.7167, "lng": 73.9851, "label": "Sheikhupura", "province": "Punjab"},
    "jhang":        {"lat": 31.2681, "lng": 72.3181, "label": "Jhang", "province": "Punjab"},
    "dera ghazi khan": {"lat": 30.0491, "lng": 70.6339, "label": "Dera Ghazi Khan", "province": "Punjab"},
    "gujrat":       {"lat": 32.5742, "lng": 74.0786, "label": "Gujrat", "province": "Punjab"},
    "sahiwal":      {"lat": 30.6682, "lng": 73.1066, "label": "Sahiwal", "province": "Punjab"},
    "okara":        {"lat": 30.8100, "lng": 73.4597, "label": "Okara", "province": "Punjab"},
    "wah cantt":    {"lat": 33.7667, "lng": 72.7667, "label": "Wah Cantt", "province": "Punjab"},
    "attock":       {"lat": 33.7667, "lng": 72.3333, "label": "Attock", "province": "Punjab"},
    "chakwal":      {"lat": 32.9317, "lng": 72.8577, "label": "Chakwal", "province": "Punjab"},
    "mianwali":     {"lat": 32.5851, "lng": 71.5433, "label": "Mianwali", "province": "Punjab"},
    "chiniot":      {"lat": 31.7167, "lng": 72.9833, "label": "Chiniot", "province": "Punjab"},

    # Sindh
    "karachi":      {"lat": 24.8607, "lng": 67.0011, "label": "Karachi", "province": "Sindh"},
    "hyderabad":    {"lat": 25.3960, "lng": 68.3578, "label": "Hyderabad", "province": "Sindh"},
    "sukkur":       {"lat": 27.7052, "lng": 68.8574, "label": "Sukkur", "province": "Sindh"},
    "larkana":      {"lat": 27.5571, "lng": 68.2194, "label": "Larkana", "province": "Sindh"},
    "nawabshah":    {"lat": 26.2442, "lng": 68.4100, "label": "Nawabshah", "province": "Sindh"},
    "mirpur khas":  {"lat": 25.5276, "lng": 69.0076, "label": "Mirpur Khas", "province": "Sindh"},
    "thatta":       {"lat": 24.7464, "lng": 67.9239, "label": "Thatta", "province": "Sindh"},
    "jacobabad":    {"lat": 28.2769, "lng": 68.4514, "label": "Jacobabad", "province": "Sindh"},

    # KPK
    "peshawar":     {"lat": 34.0151, "lng": 71.5249, "label": "Peshawar", "province": "KPK"},
    "mardan":       {"lat": 34.1985, "lng": 72.0445, "label": "Mardan", "province": "KPK"},
    "mingora":      {"lat": 34.7717, "lng": 72.3600, "label": "Mingora (Swat)", "province": "KPK"},
    "abbottabad":   {"lat": 34.1463, "lng": 73.2117, "label": "Abbottabad", "province": "KPK"},
    "mansehra":     {"lat": 34.3333, "lng": 73.2000, "label": "Mansehra", "province": "KPK"},
    "kohat":        {"lat": 33.5869, "lng": 71.4414, "label": "Kohat", "province": "KPK"},
    "dera ismail khan": {"lat": 31.8236, "lng": 70.9025, "label": "Dera Ismail Khan", "province": "KPK"},
    "charsadda":    {"lat": 34.1483, "lng": 71.7314, "label": "Charsadda", "province": "KPK"},
    "nowshera":     {"lat": 34.0153, "lng": 71.9747, "label": "Nowshera", "province": "KPK"},

    # Balochistan
    "quetta":       {"lat": 30.1798, "lng": 66.9750, "label": "Quetta", "province": "Balochistan"},
    "turbat":       {"lat": 26.0017, "lng": 63.0444, "label": "Turbat", "province": "Balochistan"},
    "khuzdar":      {"lat": 27.8000, "lng": 66.6167, "label": "Khuzdar", "province": "Balochistan"},
    "hub":          {"lat": 25.0500, "lng": 67.0833, "label": "Hub", "province": "Balochistan"},
    "gwadar":       {"lat": 25.1264, "lng": 62.3225, "label": "Gwadar", "province": "Balochistan"},
    "chaman":       {"lat": 30.9189, "lng": 66.4514, "label": "Chaman", "province": "Balochistan"},

    # AJK & GB
    "muzaffarabad": {"lat": 34.3700, "lng": 73.4711, "label": "Muzaffarabad", "province": "AJK"},
    "mirpur":       {"lat": 33.1467, "lng": 73.7500, "label": "Mirpur", "province": "AJK"},
    "gilgit":       {"lat": 35.9220, "lng": 74.3083, "label": "Gilgit", "province": "GB"},
    "skardu":       {"lat": 35.2978, "lng": 75.6333, "label": "Skardu", "province": "GB"},

    # ICT
    "islamabad":    {"lat": 33.6844, "lng": 73.0479, "label": "Islamabad", "province": "ICT"},
}


def _find_city(query: str):
    """Fuzzy city search — exact match first, then partial."""
    q = query.lower().strip()
    # Exact match
    if q in PAKISTAN_CITIES:
        return PAKISTAN_CITIES[q]
    # Partial match
    for key, city in PAKISTAN_CITIES.items():
        if q in key or key in q:
            return city
    return None


def _haversine(lat1, lng1, lat2, lng2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _estimate_travel_time(distance_km: float, mode: str = "car") -> dict:
    """Estimate travel time based on mode of transport."""
    speeds = {"car": 80, "bus": 60, "motorbike": 70, "walk": 5}
    speed = speeds.get(mode, 80)
    hours = distance_km / speed
    total_mins = int(hours * 60)
    if total_mins < 60:
        display = f"{total_mins} min"
    else:
        h = total_mins // 60
        m = total_mins % 60
        display = f"{h}h {m}m" if m > 0 else f"{h}h"
    return {"minutes": total_mins, "display": display, "speed_kmh": speed}


# ─── Request / Response Models ───────────────────────────────

class TravelCheckRequest(BaseModel):
    from_city: str
    to_city: str
    mode: str = "car"  # car | bus | motorbike | walk


class CitySearchRequest(BaseModel):
    query: str


# ─── Endpoints ──────────────────────────────────────────────

@router.get("/cities", summary="List all supported Pakistan cities")
async def get_cities():
    """Return all supported Pakistan cities grouped by province."""
    by_province: dict = {}
    for key, city in PAKISTAN_CITIES.items():
        prov = city["province"]
        if prov not in by_province:
            by_province[prov] = []
        by_province[prov].append({
            "key": key,
            "label": city["label"],
            "lat": city["lat"],
            "lng": city["lng"],
        })
    return {
        "total": len(PAKISTAN_CITIES),
        "by_province": by_province,
    }


@router.post("/check", summary="Check travel safety between two cities")
async def check_travel_safety(body: TravelCheckRequest):
    """
    Check travel safety between two Pakistan cities.

    Returns:
    - Weather at origin and destination
    - Route safety analysis (safe / unsafe / caution)
    - Estimated travel time
    - Hazards along the route
    - Recommendations
    """
    # Resolve cities
    origin = _find_city(body.from_city)
    destination = _find_city(body.to_city)

    if not origin:
        raise HTTPException(status_code=404, detail=f"City not found: '{body.from_city}'. Try a major Pakistan city name.")
    if not destination:
        raise HTTPException(status_code=404, detail=f"City not found: '{body.to_city}'. Try a major Pakistan city name.")

    if body.from_city.lower().strip() == body.to_city.lower().strip():
        raise HTTPException(status_code=400, detail="Origin and destination cannot be the same city.")

    # Distance and travel time
    distance_km = round(_haversine(origin["lat"], origin["lng"], destination["lat"], destination["lng"]), 1)
    travel_time = _estimate_travel_time(distance_km, body.mode)

    # Get weather for both cities in parallel
    origin_weather, dest_weather, route_safety = await _gather_all(origin, destination)

    # Build overall safety verdict
    verdict = _build_verdict(origin_weather, dest_weather, route_safety, distance_km)

    return {
        "origin": {
            "city": origin["label"],
            "province": origin["province"],
            "lat": origin["lat"],
            "lng": origin["lng"],
        },
        "destination": {
            "city": destination["label"],
            "province": destination["province"],
            "lat": destination["lat"],
            "lng": destination["lng"],
        },
        "distance_km": distance_km,
        "travel_time": travel_time,
        "mode": body.mode,
        "origin_weather": _format_weather(origin_weather),
        "destination_weather": _format_weather(dest_weather),
        "route_safety": route_safety,
        "verdict": verdict,
        "checked_at": now_iso(),
        "disclaimer": "AI-assisted safety assessment. Always follow official advisories.",
    }


async def _gather_all(origin: dict, destination: dict):
    """Fetch weather for both cities and route safety concurrently."""
    import asyncio
    origin_weather, dest_weather, route_safety = await asyncio.gather(
        weather_service.get_weather(origin["lat"], origin["lng"]),
        weather_service.get_weather(destination["lat"], destination["lng"]),
        weather_service.check_route_safety(
            from_lat=origin["lat"], from_lng=origin["lng"],
            to_lat=destination["lat"], to_lng=destination["lng"],
            from_label=origin["label"], to_label=destination["label"],
        ),
    )
    return origin_weather, dest_weather, route_safety


def _format_weather(weather_data: dict) -> dict:
    """Extract key weather info for travel display."""
    current = weather_data.get("current", {})
    warnings = weather_data.get("warnings", [])
    active_warnings = [w for w in warnings if w.get("severity") in ("severe", "warning")]
    return {
        "temperature": current.get("temperature", 0),
        "condition": current.get("condition", ""),
        "condition_label": current.get("condition_label", ""),
        "icon": current.get("icon", "🌤️"),
        "rain_probability": current.get("rain_probability", 0),
        "humidity": current.get("humidity", 0),
        "wind_speed": current.get("wind_speed", 0),
        "visibility": current.get("visibility", 10),
        "warnings": active_warnings[:3],
    }


def _build_verdict(origin_w: dict, dest_w: dict, route_safety: dict, distance_km: float) -> dict:
    """Build the overall travel safety verdict."""
    primary = route_safety.get("primary_route", {})
    alt = route_safety.get("alternative_route")
    safer_alt = route_safety.get("safer_alternative_available", False)

    origin_current = origin_w.get("current", {})
    dest_current = dest_w.get("current", {})

    # Score factors
    score = primary.get("safety_score", 70)
    level = primary.get("safety_level", "medium")

    # Weather severity at both ends
    bad_conditions = {"thunderstorm", "heavy_rain"}
    origin_bad = origin_current.get("condition") in bad_conditions
    dest_bad = dest_current.get("condition") in bad_conditions
    origin_rain = origin_current.get("rain_probability", 0)
    dest_rain = dest_current.get("rain_probability", 0)

    # Build risks list
    risks = []
    if origin_bad:
        risks.append({
            "type": "weather_origin",
            "severity": "high",
            "message": f"Severe weather at origin: {origin_current.get('condition_label', '')}",
            "icon": origin_current.get("icon", "⛈️"),
        })
    if dest_bad:
        risks.append({
            "type": "weather_destination",
            "severity": "high",
            "message": f"Severe weather at destination: {dest_current.get('condition_label', '')}",
            "icon": dest_current.get("icon", "⛈️"),
        })
    if origin_rain > 70 or dest_rain > 70:
        risks.append({
            "type": "heavy_rain",
            "severity": "medium",
            "message": f"High rain probability: {max(origin_rain, dest_rain)}% chance of rain",
            "icon": "🌧️",
        })
    if distance_km > 400:
        risks.append({
            "type": "long_distance",
            "severity": "low",
            "message": f"Long journey ({distance_km:.0f} km) — plan fuel stops and breaks",
            "icon": "🛣️",
        })

    # Hazards from route
    hazards = primary.get("hazards", [])
    for h in hazards[:2]:
        risks.append({
            "type": h.get("type", "hazard"),
            "severity": h.get("severity", "medium"),
            "message": h.get("label", "Hazard detected along route"),
            "icon": "⚠️",
        })

    # Overall status
    if level in ("safe", "low") and not origin_bad and not dest_bad:
        status = "safe"
        status_label = "Safe to Travel"
        status_color = "green"
        summary = f"Route from {origin_w.get('location', 'origin')} looks clear. No major hazards detected."
        advice = [
            "✅ Weather conditions are acceptable for travel",
            "✅ No major road hazards detected along this route",
            "⚠️ Always carry emergency supplies and keep your phone charged",
            "📡 Monitor local weather updates before departing",
        ]
    elif level in ("medium",) or origin_bad or dest_bad:
        status = "caution"
        status_label = "Travel with Caution"
        status_color = "yellow"
        summary = "Some risks detected along this route. Proceed carefully and stay updated."
        advice = [
            "⚠️ Adverse weather conditions may affect road visibility",
            "🚗 Reduce speed on wet or flooded sections",
            "📻 Keep local emergency radio channel tuned",
            "🔄 Consider alternative route if available",
        ]
        if safer_alt and alt:
            advice.insert(0, f"🔀 Alternative route available with better safety score ({alt.get('safety_score', 0)}/100)")
    else:
        status = "unsafe"
        status_label = "Unsafe — Avoid Travel"
        status_color = "red"
        summary = "Significant hazards detected. Travel is not recommended at this time."
        advice = [
            "🚫 High-risk conditions detected on this route",
            "🏠 Stay indoors or delay travel until conditions improve",
            "📞 Contact authorities for emergency assistance if needed",
            "📱 Monitor ReliefLink alerts for updates",
        ]
        if safer_alt and alt:
            advice.insert(0, f"🔀 Safer alternative route available — safety score {alt.get('safety_score', 0)}/100")

    return {
        "status": status,
        "status_label": status_label,
        "status_color": status_color,
        "safety_score": score,
        "summary": summary,
        "risks": risks,
        "advice": advice,
        "safer_alternative_available": safer_alt,
        "recommended_route": "alternative" if safer_alt else "primary",
    }
