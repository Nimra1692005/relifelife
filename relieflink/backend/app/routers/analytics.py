"""
Analytics Router — Dashboard statistics & performance metrics

GET /overview       — Dashboard overview stats
GET /disasters      — Disaster type breakdown
GET /response-times — Response time metrics
"""

from fastapi import APIRouter

from app.services import location_service, sos_service
from app.utils.common import success_response

router = APIRouter()


@router.get("/overview", summary="Dashboard overview")
async def overview():
    """Get comprehensive dashboard overview statistics including
    active emergencies, available teams, shelter capacity, and response times."""
    stats = await location_service.get_overview_stats()
    sos_stats = await sos_service.get_stats()
    combined = {**stats, **sos_stats}
    return success_response(data=combined)


@router.get("/disasters", summary="Disaster breakdown")
async def disaster_breakdown():
    """Get breakdown of active emergencies by disaster type."""
    # Mock breakdown
    data = [
        {"type": "flood", "count": 23, "percentage": 48.0},
        {"type": "earthquake", "count": 8, "percentage": 16.7},
        {"type": "fire", "count": 7, "percentage": 14.6},
        {"type": "landslide", "count": 5, "percentage": 10.4},
        {"type": "medical", "count": 3, "percentage": 6.3},
        {"type": "other", "count": 2, "percentage": 4.2},
    ]
    return success_response(data=data)


@router.get("/response-times", summary="Response time metrics")
async def response_times():
    """Get emergency response time statistics."""
    data = {
        "average_min": 8.5,
        "fastest_min": 3.2,
        "slowest_min": 22.0,
        "within_10min_pct": 72.0,
    }
    return success_response(data=data)
