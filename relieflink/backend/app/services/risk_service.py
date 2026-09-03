"""
ReliefLink — Risk Analysis Service

Provides AI-powered risk assessment for geographic locations.
Analyzes proximity to disaster zones, terrain, weather, and population density.
Production: Integrate with weather APIs, geological databases, and PostGIS.
"""

import random
from datetime import datetime, timezone
from typing import List

from app.database import db
from app.models.schemas import RiskAnalysisRequest
from app.utils.common import success_response, now_iso
from app.utils.geo import haversine_km, format_distance


# ─── Mock Disaster Zones ─────────────────────────────────────
_MOCK_DISASTER_ZONES = [
    {
        "id": "zone-001",
        "type": "flood",
        "severity": "critical",
        "label": "Severe Flood Zone",
        "description": "Active flooding along Nullah Lai corridor, water level 4.2m above normal",
        "latitude": 33.6750,
        "longitude": 73.0350,
        "radius_meters": 2000,
        "is_active": True,
        "created_at": "2026-08-26T12:00:00+00:00",
    },
    {
        "id": "zone-002",
        "type": "landslide",
        "severity": "high",
        "label": "Landslide Risk Area",
        "description": "Saturated hillsides in Margalla foothills, multiple slide reports",
        "latitude": 33.7400,
        "longitude": 73.0200,
        "radius_meters": 1500,
        "is_active": True,
        "created_at": "2026-08-26T14:00:00+00:00",
    },
    {
        "id": "zone-003",
        "type": "flood",
        "severity": "medium",
        "label": "Flash Flood Warning",
        "description": "Storm drains overflowing in Sector I-10 and G-11",
        "latitude": 33.6900,
        "longitude": 73.0250,
        "radius_meters": 1200,
        "is_active": True,
        "created_at": "2026-08-27T02:00:00+00:00",
    },
    {
        "id": "zone-004",
        "type": "earthquake",
        "severity": "medium",
        "label": "Seismic Activity Zone",
        "description": "Minor tremors detected, structural inspection recommended for older buildings",
        "latitude": 33.7100,
        "longitude": 73.0550,
        "radius_meters": 3000,
        "is_active": True,
        "created_at": "2026-08-25T08:00:00+00:00",
    },
    {
        "id": "zone-005",
        "type": "fire",
        "severity": "low",
        "label": "Fire Risk Area",
        "description": "Electrical infrastructure damage reported, fire risk elevated",
        "latitude": 33.7000,
        "longitude": 73.0600,
        "radius_meters": 800,
        "is_active": True,
        "created_at": "2026-08-27T04:00:00+00:00",
    },
]


# ─── Risk Factor Templates ───────────────────────────────────
def _build_risk_factors(lat: float, lng: float, nearby_hazards: list) -> list:
    """Generate risk factors based on location and nearby hazards."""
    factors = []

    # Terrain risk
    elevation_risk = random.uniform(0.0, 0.6)
    factors.append({
        "type": "terrain",
        "label": "Terrain Risk",
        "level": "low" if elevation_risk < 0.3 else "medium" if elevation_risk < 0.5 else "high",
        "weight": 0.15,
        "score": round(elevation_risk, 2),
        "description": "Low-lying area with potential water accumulation" if elevation_risk > 0.3
                       else "Stable terrain with minimal flood risk",
    })

    # Weather risk
    weather_risk = random.uniform(0.2, 0.8)
    factors.append({
        "type": "weather",
        "label": "Weather Conditions",
        "level": "medium" if weather_risk < 0.5 else "high",
        "weight": 0.25,
        "score": round(weather_risk, 2),
        "description": "Heavy rainfall expected to continue for next 6 hours" if weather_risk > 0.5
                       else "Moderate rainfall with intermittent breaks",
    })

    # Proximity to hazards
    if nearby_hazards:
        closest = min(h["distance_km"] for h in nearby_hazards)
        proximity_risk = max(0.1, 1.0 - (closest / 5.0))
        factors.append({
            "type": "proximity",
            "label": "Hazard Proximity",
            "level": "low" if proximity_risk < 0.3 else "medium" if proximity_risk < 0.6 else "high",
            "weight": 0.35,
            "score": round(proximity_risk, 2),
            "description": f"Nearest active hazard {format_distance(closest)} away",
        })
    else:
        factors.append({
            "type": "proximity",
            "label": "Hazard Proximity",
            "level": "safe",
            "weight": 0.35,
            "score": 0.05,
            "description": "No active hazards within 5 km radius",
        })

    # Population density
    pop_risk = random.uniform(0.1, 0.5)
    factors.append({
        "type": "population",
        "label": "Population Density",
        "level": "low" if pop_risk < 0.3 else "medium",
        "weight": 0.15,
        "score": round(pop_risk, 2),
        "description": "Moderate population density, evacuation manageable" if pop_risk < 0.3
                       else "High population density, evacuation may be challenging",
    })

    # Infrastructure
    infra_risk = random.uniform(0.0, 0.4)
    factors.append({
        "type": "infrastructure",
        "label": "Infrastructure Quality",
        "level": "low" if infra_risk < 0.2 else "medium",
        "weight": 0.10,
        "score": round(infra_risk, 2),
        "description": "Roads and utilities in good condition" if infra_risk < 0.2
                       else "Some road damage reported, alternative routes available",
    })

    return factors


def _score_to_level(score: int) -> tuple:
    """Convert numeric score to risk level."""
    if score <= 20:
        return "safe", "Safe", "No significant risks detected. Continue normal activities."
    elif score <= 40:
        return "low", "Low Risk", "Minor risks present. Stay alert for changing conditions."
    elif score <= 60:
        return "medium", "Moderate Risk", "Notable risks detected. Prepare emergency supplies and evacuation plan."
    elif score <= 80:
        return "high", "High Risk", "Significant danger detected. Consider immediate evacuation to safe zones."
    else:
        return "critical", "Critical Risk", "IMMEDIATE DANGER. Evacuate now to the nearest safe zone."


class RiskService:

    async def analyze_location(self, req: RiskAnalysisRequest) -> dict:
        """Perform comprehensive risk analysis for a location."""
        # Find nearby disaster zones
        nearby_hazards = []
        for zone in _MOCK_DISASTER_ZONES:
            if not zone["is_active"]:
                continue
            dist = haversine_km(req.latitude, req.longitude, zone["latitude"], zone["longitude"])
            radius_km = zone["radius_meters"] / 1000
            if dist <= radius_km + 5:  # Include zones within 5km buffer
                nearby_hazards.append({
                    "id": zone["id"],
                    "type": zone["type"],
                    "severity": zone["severity"],
                    "label": zone["label"],
                    "description": zone["description"],
                    "latitude": zone["latitude"],
                    "longitude": zone["longitude"],
                    "radius_meters": zone["radius_meters"],
                    "distance_km": round(dist, 2),
                })

        # Sort by distance
        nearby_hazards.sort(key=lambda x: x["distance_km"])

        # Build risk factors
        factors = _build_risk_factors(req.latitude, req.longitude, nearby_hazards)

        # Calculate overall score
        total_weight = sum(f["weight"] for f in factors)
        raw_score = sum(f["score"] * f["weight"] for f in factors) / total_weight if total_weight > 0 else 0
        overall_score = min(100, int(raw_score * 100))

        # Boost score if inside an active disaster zone
        for hazard in nearby_hazards:
            if hazard["distance_km"] * 1000 <= hazard["radius_meters"]:
                severity_boost = {"critical": 30, "high": 20, "medium": 10, "low": 5}
                overall_score = min(100, overall_score + severity_boost.get(hazard["severity"], 5))

        level, label, description = _score_to_level(overall_score)

        # Build recommendation
        if level in ("high", "critical"):
            recommendation = "Evacuate immediately to the nearest shelter. Bring emergency kit and important documents."
        elif level == "medium":
            recommendation = "Prepare for potential evacuation. Keep emergency supplies ready and monitor alerts."
        else:
            recommendation = "Stay informed. Monitor weather alerts and keep emergency contacts accessible."

        return success_response(data={
            "overall_score": overall_score,
            "level": level,
            "label": label,
            "description": description,
            "factors": factors,
            "nearby_hazards": nearby_hazards[:5],
            "recommendation": recommendation,
            "analyzed_at": now_iso(),
        })

    async def get_disaster_zones(self) -> dict:
        """Get all active disaster zones."""
        active = [z for z in _MOCK_DISASTER_ZONES if z["is_active"]]
        return success_response(data=active)

    async def calculate_safety_score(self, req: RiskAnalysisRequest) -> dict:
        """Calculate a simple safety score for a location (inverse of risk)."""
        # Run full analysis and invert
        analysis = await self.analyze_location(req)
        risk_data = analysis["data"]
        safety_score = 100 - risk_data["overall_score"]

        if safety_score >= 80:
            level, label = "safe", "Safe Area"
            desc = "This location is currently safe for normal activities."
        elif safety_score >= 60:
            level, label = "low", "Mostly Safe"
            desc = "Minor risks present but generally safe."
        elif safety_score >= 40:
            level, label = "medium", "Caution Required"
            desc = "Moderate risk level. Exercise caution."
        else:
            level, label = "high", "Unsafe"
            desc = "High risk area. Avoid if possible."

        return success_response(data={
            "score": safety_score,
            "level": level,
            "label": label,
            "description": desc,
            "location": f"{req.latitude:.4f}, {req.longitude:.4f}",
            "analyzed_at": now_iso(),
        })


# Singleton
risk_service = RiskService()
