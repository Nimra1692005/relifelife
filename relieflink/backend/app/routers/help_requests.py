"""
Help Requests Router — Affected-person emergency requests

POST  /            — Submit a help request (auto-creates a volunteer task)
GET   /            — List help requests (filter by user / status)
GET   /{ref}       — Get a specific help request
PATCH /{ref}       — Update help request status
"""

from fastapi import APIRouter, status
from typing import Optional

from app.models.schemas import HelpRequestCreate, HelpRequestStatusUpdate
from app.services import help_service

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit help request")
async def create_help_request(body: HelpRequestCreate):
    """Create a help request for an affected person. User ID auto-assigned (mock)."""
    return await help_service.create_help_request("user-001", body)


@router.get("", summary="List help requests")
async def list_help_requests(
    user_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
):
    """List help requests, optionally filtered by submitting user and status."""
    return await help_service.list_help_requests(user_id, status_filter, limit)


@router.get("/{ref}", summary="Get help request")
async def get_help_request(ref: str):
    """Get a specific help request by reference ID (e.g. RFL-1024)."""
    return await help_service.get_help_request(ref)


@router.patch("/{ref}", summary="Update help request status")
async def update_help_request(ref: str, body: HelpRequestStatusUpdate):
    """Update the status of a help request (admin/coordinator action)."""
    return await help_service.update_help_request_status(ref, body)
