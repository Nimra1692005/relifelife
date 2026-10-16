"""
Weather Intelligence Router — Weather data, risk analysis, and route safety

GET    /current        — Current weather + forecast + warnings
POST   /risk           — Combined weather + disaster risk assessment
POST   /route-safety   — Analyze route safety with alternatives
"""

from typing import Optional

from fastapi import APIRouter

from app.models.schemas import WeatherRequest, RouteSafetyRequest
from app.services.weather_service import weather_service

router = APIRouter()


@router.get("", summary="Get current weather (alias, accepts lat/lng)")
async def weather_root(lat: Optional[float] = None, lng: Optional[float] = None,
                       latitude: Optional[float] = None, longitude: Optional[float] = None):
    la = latitude if latitude is not None else (lat if lat is not None else 33.6844)
    lo = longitude if longitude is not None else (lng if lng is not None else 73.0479)
    return await weather_service.get_weather(la, lo)


@router.get("/forecast", summary="Weather forecast (alias, accepts lat/lng)")
async def weather_forecast(lat: Optional[float] = None, lng: Optional[float] = None,
                           latitude: Optional[float] = None, longitude: Optional[float] = None):
    return await weather_root(lat, lng, latitude, longitude)


@router.get("/current", summary="Get current weather")
async def get_current_weather(
    latitude: float = 33.6844,
    longitude: float = 73.0479,
):
    """
    Get complete weather data for a location including:
    - Current conditions (temperature, humidity, wind, rain probability)
    - 12-hour hourly forecast
    - 5-day daily forecast
    - Active weather warnings

    Currently returns mock data. Production: configure WEATHER_PROVIDER
    and WEATHER_API_KEY environment variables.
    """
    return await weather_service.get_weather(latitude, longitude)


@router.post("/risk", summary="Combined risk assessment")
async def get_combined_risk(body: WeatherRequest):
    """
    AI-assisted combined risk assessment combining:
    - Current weather conditions
    - Disaster zone proximity
    - Blocked roads
    - Shelter accessibility

    Returns risk score, level, individual factors, and recommendations.

    **Note:** This is an AI-assisted assessment, NOT a disaster prediction.
    """
    return await weather_service.get_combined_risk(body.latitude, body.longitude)


@router.post("/route-safety", summary="Check route safety")
async def check_route_safety(body: RouteSafetyRequest):
    """
    Analyze route safety between two points:
    - Weather conditions along route
    - Hazard zones that overlap the route
    - Blocked roads
    - Alternative safer route when available

    Returns primary route analysis and optional safer alternative.
    """
    return await weather_service.check_route_safety(
        from_lat=body.from_lat,
        from_lng=body.from_lng,
        to_lat=body.to_lat,
        to_lng=body.to_lng,
        from_label=body.from_label,
        to_label=body.to_label,
    )
