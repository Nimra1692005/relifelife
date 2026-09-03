"""
Locations Router — Nearby hospitals, shelters, pharmacies (100% FREE via OpenStreetMap)

GET  /nearby?type=hospitals&lat=33.68&lon=73.05   — Find nearby hospitals
GET  /nearby?type=shelters&lat=33.68&lon=73.05    — Find nearby shelters
GET  /nearby?type=all&lat=33.68&lon=73.05         — Find ALL nearby facilities
GET  /nearby/safe-places?lat=33.68&lon=73.05       — Find safe places
GET  /nearby/pharmacies?lat=33.68&lon=73.05        — Find nearby pharmacies

No API key required — uses OpenStreetMap data (free forever)
"""

from fastapi import APIRouter, Query
from typing import Optional

from app.services.location_service import location_service

router = APIRouter()


@router.get("/nearby", summary="Find nearby facilities")
async def find_nearby(
    type: str = Query("hospitals", description="Type: hospitals | shelters | pharmacies | fire_stations | police | schools | all"),
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(5000, description="Search radius in meters (max 10000)"),
    limit: int = Query(20, description="Max results"),
):
    """
    Find nearby hospitals, shelters, pharmacies etc. using OpenStreetMap.
    **100% FREE — No API key required.**

    Types available:
    - `hospitals` — Hospitals and clinics
    - `shelters` — Emergency shelters and camps
    - `pharmacies` — Medical stores
    - `fire_stations` — Fire brigade
    - `police` — Police stations
    - `schools` — Schools and community centers (can be used as shelters)
    - `all` — All facility types combined
    """
    radius = min(radius, 10000)  # Cap at 10km

    if type == "all":
        return await location_service.find_all_nearby(lat, lon, radius)

    return await location_service.find_nearby(lat, lon, type, radius, limit)


@router.get("/nearby/hospitals", summary="Nearby hospitals")
async def nearby_hospitals(
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(5000, description="Radius in meters"),
    limit: int = Query(20, description="Max results"),
):
    """Find nearby hospitals and clinics."""
    return await location_service.find_nearby(lat, lon, "hospitals", min(radius, 10000), limit)


@router.get("/nearby/shelters", summary="Nearby shelters")
async def nearby_shelters(
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(5000, description="Radius in meters"),
    limit: int = Query(20, description="Max results"),
):
    """Find nearby emergency shelters."""
    return await location_service.find_nearby(lat, lon, "shelters", min(radius, 10000), limit)


@router.get("/nearby/pharmacies", summary="Nearby pharmacies")
async def nearby_pharmacies(
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(3000, description="Radius in meters"),
    limit: int = Query(20, description="Max results"),
):
    """Find nearby pharmacies / medical stores."""
    return await location_service.find_nearby(lat, lon, "pharmacies", min(radius, 10000), limit)


@router.get("/nearby/fire-stations", summary="Nearby fire stations")
async def nearby_fire_stations(
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(5000, description="Radius in meters"),
    limit: int = Query(10, description="Max results"),
):
    """Find nearby fire stations."""
    return await location_service.find_nearby(lat, lon, "fire_stations", min(radius, 10000), limit)


@router.get("/nearby/safe-places", summary="Nearby safe places")
async def nearby_safe_places(
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(3000, description="Radius in meters"),
):
    """Find nearby safe places (shelters, schools, community centers) for evacuation."""
    return await location_service.get_safe_places(lat, lon, min(radius, 10000))


@router.get("/nearby/all", summary="All nearby facilities")
async def all_nearby(
    lat: float = Query(33.6844, description="Latitude"),
    lon: float = Query(73.0479, description="Longitude"),
    radius: int = Query(5000, description="Radius in meters"),
):
    """Find ALL types of nearby emergency facilities at once."""
    return await location_service.find_all_nearby(lat, lon, min(radius, 10000))
