"""
Volunteers Router — Volunteer coordination

GET    /            — List all volunteers
POST   /register    — Register as a volunteer
"""

from fastapi import APIRouter

from app.models.schemas import VolunteerRegister
from app.services import location_service

router = APIRouter()


@router.get("", summary="List volunteers")
async def list_volunteers():
    """Get all registered volunteers."""
    return await location_service.list_volunteers()


@router.post("/register", status_code=201, summary="Register volunteer")
async def register_volunteer(body: VolunteerRegister):
    """Register a new volunteer with their skills and availability."""
    data = body.model_dump()
    return await location_service.register_volunteer(data)
