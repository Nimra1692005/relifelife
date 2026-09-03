"""
SOS Requests Router — Emergency request lifecycle management

POST   /            — Create new SOS request
GET    /            — List SOS requests (with filters)
GET    /{sos_id}    — Get specific SOS request
PATCH  /{sos_id}    — Update SOS status/priority
POST   /{sos_id}/assign — Assign rescue team
"""

from fastapi import APIRouter, status
from typing import Optional

from app.models.schemas import (
    SOSCreateRequest, SOSUpdateRequest, SOSAssignRequest,
)
from app.services import sos_service

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create SOS request")
async def create_sos(body: SOSCreateRequest):
    """Create a new emergency SOS request. User ID is auto-assigned (mock: user-001)."""
    # In production: extract user_id from auth token
    return await sos_service.create("user-001", body)


@router.get("", summary="List SOS requests")
async def list_sos(
    status_filter: Optional[str] = None,
    urgency: Optional[str] = None,
    limit: int = 50,
):
    """List all SOS requests with optional status and urgency filters."""
    return await sos_service.list_all(status_filter, urgency, limit)


@router.get("/stats", summary="SOS statistics")
async def sos_stats():
    """Get summary statistics for SOS requests."""
    return {"success": True, "data": await sos_service.get_stats()}


@router.get("/{sos_id}", summary="Get SOS request")
async def get_sos(sos_id: str):
    """Get details of a specific SOS request by ID."""
    return await sos_service.get_by_id(sos_id)


@router.patch("/{sos_id}", summary="Update SOS request")
async def update_sos(sos_id: str, body: SOSUpdateRequest):
    """Update SOS request status, priority, or assign a team."""
    return await sos_service.update(sos_id, body)


@router.post("/{sos_id}/assign", summary="Assign rescue team")
async def assign_team(sos_id: str, body: SOSAssignRequest):
    """Assign a rescue team to an SOS request."""
    return await sos_service.assign_team(sos_id, body)
