"""
Safe Routes Router — Calculate safest path avoiding danger zones

POST /  — Calculate safest route between two points
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from app.services.risk_service import _MOCK_DISASTER_ZONES
from app.utils.common import success_response, now_iso
from app.utils.geo import haversine_km, format_distance

router = APIRouter()


class RouteRequest(BaseModel):
    start_latitude: float
    start_longitude: float
    end_latitude: float
    end_longitude: float
    avoid_zones: Optional[List[str]] = None


class RouteWaypoint(BaseModel):
    latitude: float
    longitude: float
    instruction: str
    distance_km: float


@router.post("", summary="Calculate safe route")
async def calculate_route(body: RouteRequest):
    """Calculate the safest route between two points, avoiding active disaster zones.

    Production: Integrate with OSRM/Mapbox routing + PostGIS zone exclusion.
    Currently: Simulates a route with waypoints.
    """
    start_lat, start_lng = body.start_latitude, body.start_longitude
    end_lat, end_lng = body.end_latitude, body.end_longitude

    # Calculate direct distance
    direct_dist = haversine_km(start_lat, start_lng, end_lat, end_lng)

    # Check for danger zones along path
    danger_zones = []
    for zone in _MOCK_DISASTER_ZONES:
        if not zone["is_active"]:
            continue
        # Simplified: check if zone center is within 2km of the midpoint
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        dist_to_zone = haversine_km(mid_lat, mid_lng, zone["latitude"], zone["longitude"])
        radius_km = zone["radius_meters"] / 1000
        if dist_to_zone <= radius_km + 2:
            danger_zones.append({
                "id": zone["id"],
                "type": zone["type"],
                "severity": zone["severity"],
                "label": zone["label"],
                "avoid_distance_km": round(dist_to_zone, 2),
            })

    # Simulate route: if danger zones found, detour adds 30% distance
    detour_factor = 1.3 if danger_zones else 1.0
    total_distance = direct_dist * detour_factor

    # Generate mock waypoints
    waypoints = [
        {
            "latitude": start_lat,
            "longitude": start_lng,
            "instruction": "Start — Head towards the main road",
            "distance_km": 0.0,
        },
        {
            "latitude": (start_lat + end_lat) / 2,
            "longitude": (start_lng + end_lng) / 2,
            "instruction": "Continue straight — Avoid flooded underpass" if danger_zones
                         else "Continue on main road",
            "distance_km": round(total_distance * 0.5, 2),
        },
        {
            "latitude": end_lat,
            "longitude": end_lng,
            "instruction": "Arrive at destination — Shelter/hospital ahead",
            "distance_km": round(total_distance, 2),
        },
    ]

    # Estimate travel time (walking: ~5 km/h)
    estimated_minutes = int((total_distance / 5.0) * 60)

    return success_response(data={
        "start": {"latitude": start_lat, "longitude": start_lng},
        "end": {"latitude": end_lat, "longitude": end_lng},
        "total_distance_km": round(total_distance, 2),
        "total_distance_display": format_distance(total_distance),
        "estimated_time_minutes": estimated_minutes,
        "danger_zones_avoided": danger_zones,
        "waypoints": waypoints,
        "is_safe": len(danger_zones) == 0,
        "recommendation": "Route avoids all known danger zones" if not danger_zones
                         else f"Route detours around {len(danger_zones)} danger zone(s). Stay alert.",
        "calculated_at": now_iso(),
    })
