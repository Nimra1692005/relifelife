"""
Rescue Teams Router — Field team management

GET    /                    — List all rescue teams
PATCH  /{team_id}/location  — Update team's GPS location
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import location_service

router = APIRouter()


class LocationBody(BaseModel):
    latitude: float
    longitude: float


@router.get("", summary="List rescue teams")
async def list_teams():
    """Get all registered rescue teams with their current status."""
    return await location_service.list_teams()


@router.patch("/{team_id}/location", summary="Update team location")
async def update_location(team_id: str, body: LocationBody):
    """Update the GPS location of a rescue team in the field."""
    return await location_service.update_team_location(team_id, body.latitude, body.longitude)
