"""
Hospitals Router — Medical facility management

GET    /           — List all hospitals
POST   /           — Create a new hospital (admin)
"""

from fastapi import APIRouter

from app.models.schemas import HospitalCreate
from app.services import location_service

router = APIRouter()


@router.get("", summary="List all hospitals")
async def list_hospitals():
    """Get all registered hospitals."""
    return await location_service.list_hospitals()


@router.post("", status_code=201, summary="Create hospital")
async def create_hospital(body: HospitalCreate):
    """Register a new hospital (admin)."""
    data = body.model_dump()
    return await location_service.create_hospital(data)
