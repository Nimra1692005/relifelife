"""
Shelters Router — Emergency shelter management

GET    /           — List all shelters
POST   /           — Create a new shelter (admin)
PATCH  /{id}       — Update shelter details
"""

from fastapi import APIRouter

from app.models.schemas import ShelterCreate
from app.services import location_service
from app.database import db
from app.utils.common import success_response, NotFoundError

router = APIRouter()


@router.get("", summary="List all shelters")
async def list_shelters():
    """Get all registered emergency shelters."""
    return await location_service.list_shelters()


@router.post("", status_code=201, summary="Create shelter")
async def create_shelter(body: ShelterCreate):
    """Register a new emergency shelter (admin)."""
    data = body.model_dump()
    return await location_service.create_shelter(data)


@router.patch("/{shelter_id}", summary="Update shelter")
async def update_shelter(shelter_id: str, body: ShelterCreate):
    """Update an existing shelter's details."""
    updated = await db.table_update("shelters", {"id": shelter_id}, body.model_dump())
    if not updated:
        raise NotFoundError("Shelter", shelter_id)
    return success_response(data=updated, message="Shelter updated")
