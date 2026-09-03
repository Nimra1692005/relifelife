"""
ReliefLink — Weather Intelligence Service

Provides current weather, forecasts, warnings, and combined risk analysis.
Supports OpenWeatherMap API for real data + mock fallback.

Architecture:
  - Provider pattern: real API when WEATHER_PROVIDER=openweathermap + key set
  - Combined risk: aggregates weather + disaster zones + blocked roads
  - Route safety: analyzes weather/hazards along routes with alternatives
"""

import math
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.utils.common import now_iso


# ─── OpenWeatherMap API ──────────────────────────────────────

OWM_BASE = "https://api.openweathermap.org/data/2.5"
OWM_ONECALL = "https://api.openweathermap.org/data/3.0/onecall"

# Map OpenWeatherMap condition codes to our internal format
_OWM_CONDITION_MAP = {
    "Thunderstorm": ("thunderstorm", "⛈️"),
    "Drizzle": ("drizzle", "🌦️"),
    "Rain": ("heavy_rain", "🌧️"),
    "Snow": ("snow", "🌨️"),
    "Mist": ("fog", "🌫️"),
    "Fog": ("fog", "🌫️"),
    "Haze": ("fog", "🌫️"),
    "Clear": ("clear", "☀️"),
    "Clouds": ("cloudy", "☁️"),
}


def _map_owm_condition(main: str, description: str) -> tuple:
    """Map OpenWeatherMap condition to internal format."""
    for key, (condition, icon) in _OWM_CONDITION_MAP.items():
        if key.lower() in main.lower():
            # Distinguish light vs heavy rain
            if key == "Rain" and "light" in description.lower():
                return ("light_rain", "🌦️", description.title())
            return (condition, icon, description.title())
    return ("partly_cloudy", "⛅", description.title())


def _wind_direction(degrees: float) -> str:
    dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = round(degrees / 45) % 8
    return dirs[idx]


class OpenWeatherMapProvider:
    """Real weather data from OpenWeatherMap API."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather conditions."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{OWM_BASE}/weather",
                params={
                    "lat": lat, "lon": lon,
                    "appid": self.api_key, "units": "metric"
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()

        main = data["weather"][0]["main"]
        desc = data["weather"][0]["description"]
        condition, icon, label = _map_owm_condition(main, desc)

        wind_deg = data.get("wind", {}).get("deg", 0)
        rain_1h = data.get("rain", {}).get("1h", 0)

        # Estimate rain probability from humidity + clouds + rain volume
        humidity = data["main"].get("humidity", 50)
        clouds = data.get("clouds", {}).get("all", 0)
        rain_prob = min(100, round((humidity * 0.3) + (clouds * 0.4) + (rain_1h * 10)))

        return {
            "temperature": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"].get("feels_like", data["main"]["temp"]), 1),
            "condition": condition,
            "condition_label": label,
            "humidity": humidity,
            "wind_speed": round(data["wind"].get("speed", 0) * 3.6, 1),  # m/s → km/h
            "wind_direction": _wind_direction(wind_deg),
            "rain_probability": rain_prob,
            "visibility": round(data.get("visibility", 10000) / 1000, 1),  # m → km
            "pressure": data["main"].get("pressure", 1013),
            "icon": icon,
            "raw_rain_1h": rain_1h,
        }

    async def get_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get 5-day/3-hour forecast."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{OWM_BASE}/forecast",
                params={
                    "lat": lat, "lon": lon,
                    "appid": self.api_key, "units": "metric", "cnt": 12
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()

        hourly = []
        for item in data.get("list", [])[:12]:
            dt = item["dt"]
            from datetime import datetime, timezone
            time = datetime.fromtimestamp(dt, tz=timezone.utc).strftime("%H:%M")

            main = item["weather"][0]["main"]
            desc = item["weather"][0]["description"]
            condition, icon, label = _map_owm_condition(main, desc)

            pop = item.get("pop", 0)  # probability of precipitation (0-1)

            hourly.append({
                "hour": time,
                "temp": round(item["main"]["temp"], 1),
                "condition": condition,
                "condition_label": label,
                "rain_probability": round(pop * 100),
                "icon": icon,
            })

        return {"hourly_forecast": hourly}

    async def get_air_pollution(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Get current air quality (bonus feature)."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{OWM_BASE}/air_pollution",
                    params={"lat": lat, "lon": lon, "appid": self.api_key},
                    timeout=10.0,
                )
                resp.raise_for_status()
                data = resp.json()

            if data.get("list"):
                item = data["list"][0]
                aqi = item["main"]["aqi"]  # 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
                components = item["components"]
                aqi_labels = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}
                return {
                    "aqi": aqi,
                    "label": aqi_labels.get(aqi, "Unknown"),
                    "pm2_5": components.get("pm2_5", 0),
                    "pm10": components.get("pm10", 0),
                    "o3": components.get("o3", 0),
                    "no2": components.get("no2", 0),
                }
        except Exception:
            pass
        return None


# ─── Mock Data (fallback) ────────────────────────────────────

_MOCK_CURRENT = {
    "temperature": 28.0, "feels_like": 32.0, "condition": "heavy_rain",
    "condition_label": "Heavy Rain", "humidity": 89, "wind_speed": 24.0,
    "wind_direction": "NE", "rain_probability": 85, "visibility": 3.5,
    "pressure": 1008, "icon": "🌧️",
}

_MOCK_HOURLY = [
    {"hour": "14:00", "temp": 28, "condition": "heavy_rain", "condition_label": "Heavy Rain", "rain_probability": 85, "icon": "🌧️"},
    {"hour": "15:00", "temp": 27, "condition": "heavy_rain", "condition_label": "Heavy Rain", "rain_probability": 90, "icon": "🌧️"},
    {"hour": "16:00", "temp": 26, "condition": "thunderstorm", "condition_label": "Thunderstorm", "rain_probability": 92, "icon": "⛈️"},
    {"hour": "17:00", "temp": 25, "condition": "thunderstorm", "condition_label": "Thunderstorm", "rain_probability": 88, "icon": "⛈️"},
    {"hour": "18:00", "temp": 24, "condition": "heavy_rain", "condition_label": "Heavy Rain", "rain_probability": 80, "icon": "🌧️"},
    {"hour": "19:00", "temp": 24, "condition": "light_rain", "condition_label": "Light Rain", "rain_probability": 65, "icon": "🌦️"},
    {"hour": "20:00", "temp": 23, "condition": "light_rain", "condition_label": "Light Rain", "rain_probability": 55, "icon": "🌦️"},
    {"hour": "21:00", "temp": 23, "condition": "cloudy", "condition_label": "Cloudy", "rain_probability": 40, "icon": "☁️"},
    {"hour": "22:00", "temp": 22, "condition": "cloudy", "condition_label": "Cloudy", "rain_probability": 35, "icon": "☁️"},
    {"hour": "23:00", "temp": 22, "condition": "partly_cloudy", "condition_label": "Partly Cloudy", "rain_probability": 25, "icon": "⛅"},
    {"hour": "00:00", "temp": 21, "condition": "partly_cloudy", "condition_label": "Partly Cloudy", "rain_probability": 20, "icon": "⛅"},
    {"hour": "01:00", "temp": 21, "condition": "cloudy", "condition_label": "Cloudy", "rain_probability": 15, "icon": "☁️"},
]

_MOCK_WARNINGS = [
    {"id": "warn-001", "severity": "severe", "title": "Flash Flood Warning",
     "description": "Heavy monsoon rainfall may cause flash flooding in low-lying areas of Islamabad. Stay away from Nullah Lei corridor.",
     "action": "Avoid low-lying areas and move to higher ground if water levels rise.", "icon": "🌊"},
    {"id": "warn-002", "severity": "warning", "title": "Thunderstorm Warning",
     "description": "Thunderstorms expected between 3-6 PM. Risk of lightning strikes in open areas.",
     "action": "Stay indoors during thunderstorms. Avoid open fields and tall structures.", "icon": "⛈️"},
    {"id": "warn-003", "severity": "advisory", "title": "Reduced Visibility",
     "description": "Heavy rain reducing visibility to below 4 km in most areas. Drive with caution.",
     "action": "Use hazard lights while driving. Reduce speed on wet roads.", "icon": "🌫️"},
]

_MOCK_HAZARD_ZONES = [
    {"id": "zone-001", "type": "flood", "severity": "critical", "label": "Nullah Lei Flood Zone", "lat": 33.675, "lng": 73.035, "radius_m": 2000},
    {"id": "zone-002", "type": "landslide", "severity": "high", "label": "Margalla Landslide Risk", "lat": 33.740, "lng": 73.020, "radius_m": 1500},
    {"id": "zone-003", "type": "flood", "severity": "medium", "label": "E-11 Flash Flood", "lat": 33.665, "lng": 73.010, "radius_m": 1000},
]

_MOCK_BLOCKED_ROADS = [
    {"name": "Jinnah Avenue near F-7", "from_lat": 33.710, "from_lng": 73.050, "to_lat": 33.715, "to_lng": 73.055},
]


# ─── Helpers ─────────────────────────────────────────────────

def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _score_to_level(score: int) -> str:
    if score <= 15: return "safe"
    if score <= 35: return "low"
    if score <= 55: return "medium"
    if score <= 75: return "high"
    return "critical"

_LEVEL_LABELS = {"safe": "Safe", "low": "Low Risk", "medium": "Moderate Risk", "high": "High Risk", "critical": "Critical Risk"}


# ─── Weather Service ─────────────────────────────────────────

class WeatherService:
    """
    Weather intelligence provider with OpenWeatherMap support.
    Automatically uses real API when WEATHER_PROVIDER=openweathermap and key is set.
    Falls back to mock data otherwise.
    """

    def __init__(self):
        self._provider: Optional[OpenWeatherMapProvider] = None
        if settings.weather_provider == "openweathermap" and settings.weather_api_key:
            self._provider = OpenWeatherMapProvider(settings.weather_api_key)
            print(f"🌦️ Weather: OpenWeatherMap API (key: ...{settings.weather_api_key[-6:]})")
        else:
            print("🌦️ Weather: Mock data provider")

    @property
    def is_live(self) -> bool:
        return self._provider is not None

    async def get_weather(
        self, latitude: float = 33.6844, longitude: float = 73.0479
    ) -> Dict[str, Any]:
        """Get complete weather data for a location."""

        if self._provider:
            try:
                current = await self._provider.get_current_weather(latitude, longitude)
                forecast_data = await self._provider.get_forecast(latitude, longitude)
                air_quality = await self._provider.get_air_pollution(latitude, longitude)

                # Generate warnings from real data
                warnings = self._generate_warnings_from_data(current)

                result = {
                    "location": f"Lat {latitude:.2f}, Lng {longitude:.2f}",
                    "source": "OpenWeatherMap API",
                    "current": current,
                    "hourly_forecast": forecast_data.get("hourly_forecast", _MOCK_HOURLY),
                    "warnings": warnings,
                    "fetched_at": now_iso(),
                }
                if air_quality:
                    result["air_quality"] = air_quality
                return result

            except httpx.HTTPStatusError as e:
                print(f"⚠️ OpenWeatherMap API error: {e.response.status_code}")
                return self._mock_weather(latitude, longitude, error=str(e))
            except Exception as e:
                print(f"⚠️ Weather API fallback: {e}")
                return self._mock_weather(latitude, longitude, error=str(e))

        return self._mock_weather(latitude, longitude)

    def _mock_weather(self, lat: float, lng: float, error: str = None) -> Dict[str, Any]:
        result = {
            "location": f"Lat {lat:.2f}, Lng {lng:.2f}",
            "source": "Mock Data Provider",
            "current": _MOCK_CURRENT,
            "hourly_forecast": _MOCK_HOURLY,
            "warnings": _MOCK_WARNINGS,
            "fetched_at": now_iso(),
        }
        if error:
            result["error"] = f"API error, using mock data: {error}"
        return result

    def _generate_warnings_from_data(self, current: Dict) -> List[Dict]:
        """Generate weather warnings from real data."""
        warnings = []

        # Heavy rain warning
        if current["rain_probability"] > 80 or current.get("raw_rain_1h", 0) > 5:
            warnings.append({
                "id": "warn-rain", "severity": "severe",
                "title": "Heavy Rainfall Warning",
                "description": f"Rain probability at {current['rain_probability']}%. Risk of flooding in low-lying areas.",
                "action": "Avoid low-lying areas. Carry rain gear. Stay updated.",
                "icon": "🌧️",
            })

        # Thunderstorm
        if current["condition"] == "thunderstorm":
            warnings.append({
                "id": "warn-thunder", "severity": "severe",
                "title": "Thunderstorm Warning",
                "description": "Active thunderstorm conditions. Risk of lightning.",
                "action": "Stay indoors. Avoid open areas and tall structures.",
                "icon": "⛈️",
            })

        # High wind
        if current["wind_speed"] > 40:
            warnings.append({
                "id": "warn-wind", "severity": "warning",
                "title": "High Wind Warning",
                "description": f"Wind speed at {current['wind_speed']} km/h from {current['wind_direction']}.",
                "action": "Secure loose objects. Avoid traveling if possible.",
                "icon": "💨",
            })

        # Low visibility
        if current.get("visibility", 10) < 4:
            warnings.append({
                "id": "warn-visibility", "severity": "advisory",
                "title": "Low Visibility Advisory",
                "description": f"Visibility reduced to {current['visibility']} km.",
                "action": "Use hazard lights. Drive slowly. Keep distance.",
                "icon": "🌫️",
            })

        # If no warnings, add a safe one
        if not warnings:
            warnings.append({
                "id": "info-ok", "severity": "normal",
                "title": "No Active Warnings",
                "description": "Current weather conditions are within normal range for this area.",
                "action": "Stay informed through regular weather updates.",
                "icon": "✅",
            })

        return warnings

    async def get_combined_risk(
        self, latitude: float = 33.6844, longitude: float = 73.0479
    ) -> Dict[str, Any]:
        """Combined weather + disaster risk assessment."""
        factors: List[Dict[str, Any]] = []
        total_impact = 0.0

        # Get current weather (real or mock)
        if self._provider:
            try:
                current = await self._provider.get_current_weather(latitude, longitude)
            except Exception:
                current = _MOCK_CURRENT
        else:
            current = _MOCK_CURRENT

        # 1. Weather risk
        rain = current["rain_probability"]
        rain_risk = min(100, rain + (20 if current["condition"] in ("heavy_rain", "thunderstorm") else 0))
        factors.append({
            "id": "weather-rain", "type": "weather", "label": "Rainfall Risk",
            "severity": "high" if rain_risk > 70 else "medium" if rain_risk > 40 else "low",
            "description": f"Rain probability {rain}% with {current['condition_label'].lower()}",
            "impact": rain_risk,
        })
        total_impact += rain_risk * 0.25

        # Wind
        if current["wind_speed"] > 30:
            wind_risk = min(100, int((current["wind_speed"] / 80) * 100))
            factors.append({
                "id": "weather-wind", "type": "wind", "label": "Wind Conditions",
                "severity": "high" if wind_risk > 60 else "medium",
                "description": f"Wind speed {current['wind_speed']} km/h from {current['wind_direction']}",
                "impact": wind_risk,
            })
            total_impact += wind_risk * 0.1

        # Thunderstorm
        if current["condition"] == "thunderstorm":
            factors.append({
                "id": "weather-thunderstorm", "type": "weather", "label": "Thunderstorm",
                "severity": "high", "description": "Active thunderstorm — risk of lightning strikes",
                "impact": 75,
            })
            total_impact += 75 * 0.15

        # 2. Disaster zone proximity
        nearby = []
        for hz in _MOCK_HAZARD_ZONES:
            dist = _haversine(latitude, longitude, hz["lat"], hz["lng"])
            if dist < 5:
                nearby.append({**hz, "distance_km": dist})
        nearby.sort(key=lambda x: x["distance_km"])

        for hz in nearby[:3]:
            proximity_impact = max(10, round(100 - hz["distance_km"] * 20))
            sev_mult = {"critical": 1.0, "high": 0.8, "medium": 0.5}.get(hz["severity"], 0.3)
            impact = round(proximity_impact * sev_mult)
            factors.append({
                "id": f"hazard-{hz['id']}", "type": hz["type"], "label": hz["label"],
                "severity": hz["severity"],
                "description": f"{hz['label']} ({hz['distance_km']:.1f} km away)",
                "impact": impact,
            })
            total_impact += impact * 0.15

        # 3. Blocked roads
        blocked_nearby = 0
        for br in _MOCK_BLOCKED_ROADS:
            d1 = _haversine(latitude, longitude, br["from_lat"], br["from_lng"])
            d2 = _haversine(latitude, longitude, br["to_lat"], br["to_lng"])
            if min(d1, d2) < 5:
                blocked_nearby += 1
        if blocked_nearby > 0:
            factors.append({
                "id": "roads-blocked", "type": "road", "label": "Blocked Roads",
                "severity": "high" if blocked_nearby >= 3 else "medium" if blocked_nearby >= 1 else "low",
                "description": f"{blocked_nearby} road(s) blocked nearby",
                "impact": blocked_nearby * 25,
            })
            total_impact += blocked_nearby * 15

        # Score & level
        overall_score = min(100, round(total_impact))
        level = _score_to_level(overall_score)
        label = _LEVEL_LABELS.get(level, "Unknown")

        top_factors = sorted(factors, key=lambda f: f["impact"], reverse=True)[:3]
        description = f"Key risks: {', '.join(f['label'] for f in top_factors)}." if top_factors else "No significant risks detected."

        if level == "critical":
            recommendation = "Immediate danger detected. Evacuate to the nearest safe shelter now."
        elif level == "high":
            recommendation = "Move toward the nearest available safe shelter. Avoid flood zones and blocked roads."
        elif level == "medium":
            recommendation = "Stay alert. Prepare emergency supplies and monitor weather updates."
        else:
            recommendation = "Conditions are relatively safe. Stay informed and keep emergency contacts accessible."

        return {
            "overall_score": overall_score, "level": level, "label": label,
            "description": description, "factors": factors,
            "recommendation": recommendation,
            "weather_source": "OpenWeatherMap" if self.is_live else "Mock",
            "disclaimer": "AI-assisted risk assessment. Not a prediction. Follow official guidance.",
            "analyzed_at": now_iso(),
        }

    async def check_route_safety(
        self, from_lat: float = 33.6844, from_lng: float = 73.0479,
        to_lat: float = 33.6998, to_lng: float = 73.0125,
        from_label: str = "Current Location", to_label: str = "F-11 Community Center",
    ) -> Dict[str, Any]:
        """Analyze route safety with primary and alternative routes."""

        # Get current weather for route analysis
        if self._provider:
            try:
                current = await self._provider.get_current_weather(from_lat, from_lng)
            except Exception:
                current = _MOCK_CURRENT
        else:
            current = _MOCK_CURRENT

        def _analyze_route(route_id: str, name: str, detour: float) -> Dict[str, Any]:
            direct = _haversine(from_lat, from_lng, to_lat, to_lng)
            distance = direct * (1 + detour * 0.3)
            minutes = round((distance / 30) * 60 + 5)

            hazards = []
            mid_lat = (from_lat + to_lat) / 2 + detour * 0.008
            mid_lng = (from_lng + to_lng) / 2 + detour * 0.006

            for hz in _MOCK_HAZARD_ZONES:
                d1 = _haversine(from_lat, from_lng, hz["lat"], hz["lng"])
                d2 = _haversine(mid_lat, mid_lng, hz["lat"], hz["lng"])
                d3 = _haversine(to_lat, to_lng, hz["lat"], hz["lng"])
                closest = min(d1, d2, d3)
                if closest <= hz["radius_m"] / 1000 + 1.5:
                    hazards.append({"id": hz["id"], "type": hz["type"], "label": hz["label"],
                                    "severity": hz["severity"], "description": hz["label"],
                                    "distance_km": round(closest, 2)})

            blocked = 0
            for br in _MOCK_BLOCKED_ROADS:
                d1 = _haversine(mid_lat, mid_lng, br["from_lat"], br["from_lng"])
                d2 = _haversine(mid_lat, mid_lng, br["to_lat"], br["to_lng"])
                if min(d1, d2) < 2 + detour:
                    blocked += 1

            score = 100
            for h in hazards:
                score -= {"critical": 25, "high": 18, "medium": 10}.get(h["severity"], 5)
            score -= blocked * 15
            if current["condition"] == "thunderstorm": score -= 20
            elif current["condition"] == "heavy_rain": score -= 15
            if current["rain_probability"] > 70: score -= 10
            score = max(0, min(100, score))

            level = _score_to_level(100 - score)
            risky = len([h for h in hazards if h["severity"] in ("high", "critical")])

            dist_display = f"{distance:.1f} km" if distance >= 1 else f"{int(distance * 1000)}m"
            time_display = f"{minutes} min" if minutes < 60 else f"{minutes // 60}h {minutes % 60}m"

            if level in ("safe", "low"):
                rec = "This route appears safe. Monitor conditions during travel."
            elif level == "medium":
                rec = "Exercise caution. Some risk points detected along this route."
            else:
                rec = "This route has significant hazards. Consider an alternative if available."

            return {
                "id": route_id, "name": name,
                "distance_km": round(distance, 2), "distance_display": dist_display,
                "estimated_minutes": minutes, "estimated_time_display": time_display,
                "safety_score": score, "safety_level": level,
                "safety_label": {"safe": "Safe", "low": "Mostly Safe", "medium": "Moderate Risk",
                                 "high": "Hazardous", "critical": "Critical"}.get(level, "Unknown"),
                "weather": {
                    "condition": current["condition_label"], "icon": current["icon"],
                    "rain_probability": current["rain_probability"],
                    "temperature": current["temperature"],
                    "areas": [h["label"] for h in hazards] if hazards else ["No significant weather concerns"],
                },
                "hazards": hazards, "blocked_roads": blocked, "risky_points": risky,
                "is_recommended": False, "recommendation": rec,
            }

        primary = _analyze_route("route-primary", "Direct Route", 0)
        alternative = _analyze_route("route-alt", "Alternative Route", 1)

        safer = alternative["safety_score"] > primary["safety_score"] + 5
        primary["is_recommended"] = not safer
        alternative["is_recommended"] = safer

        return {
            "origin": {"lat": from_lat, "lng": from_lng, "label": from_label},
            "destination": {"lat": to_lat, "lng": to_lng, "label": to_label},
            "primary_route": primary,
            "alternative_route": alternative if safer else None,
            "safer_alternative_available": safer,
            "weather_source": "OpenWeatherMap" if self.is_live else "Mock",
            "analyzed_at": now_iso(),
            "disclaimer": "AI-assisted route safety assessment. Actual conditions may vary.",
        }


weather_service = WeatherService()
