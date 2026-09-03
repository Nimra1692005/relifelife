"""
ReliefLink — Geospatial Utilities

Provides distance calculations and geospatial helpers.
Uses the Haversine formula for accurate geodesic distances.
Production: Replace with PostGIS queries when using Supabase PostgreSQL.
"""

import math
from typing import List, Tuple


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in meters."""
    return haversine_km(lat1, lng1, lat2, lng2) * 1000


def is_within_radius(
    lat1: float, lng1: float, lat2: float, lng2: float, radius_km: float
) -> bool:
    """Check if point2 is within radius_km of point1."""
    return haversine_km(lat1, lng1, lat2, lng2) <= radius_km


def bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the initial bearing from point1 to point2 (degrees)."""
    dlng = math.radians(lng2 - lng1)
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    x = math.sin(dlng) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlng)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def midpoint(lat1: float, lng1: float, lat2: float, lng2: float) -> Tuple[float, float]:
    """Calculate the geographic midpoint between two points."""
    return ((lat1 + lat2) / 2, (lng1 + lng2) / 2)


def format_distance(km: float) -> str:
    """Format distance for display."""
    if km < 1:
        return f"{int(km * 1000)}m"
    return f"{km:.1f} km"


def sort_by_distance(
    items: list, user_lat: float, user_lng: float, lat_key: str = "latitude", lng_key: str = "longitude"
) -> list:
    """Sort a list of dicts by distance from user, closest first."""
    def dist(item):
        return haversine_km(user_lat, user_lng, item.get(lat_key, 0), item.get(lng_key, 0))
    return sorted(items, key=dist)
