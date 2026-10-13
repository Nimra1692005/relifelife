"""
Volunteer Tasks Router — Task queue for volunteers

GET   /                  — List available (open) tasks with filters
POST  /{task_id}/claim   — Claim a task for a volunteer
PATCH /{task_id}/progress — Update task progress/status
GET   /my-assignments    — Tasks assigned to a volunteer
GET   /volunteer-stats   — Aggregate volunteer impact stats
"""

from fastapi import APIRouter, status
from typing import Optional

from app.models.schemas import TaskClaim, TaskProgressUpdate
from app.services import help_service

router = APIRouter()


@router.get("", summary="List available tasks")
async def list_available_tasks(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
):
    """List open volunteer tasks with optional category/location/search filters."""
    return await help_service.list_available_tasks(category, location, search)


@router.get("/my-assignments", summary="My assigned tasks")
async def my_assignments(volunteer_id: str):
    """List tasks claimed/assigned to a specific volunteer."""
    return await help_service.list_my_assignments(volunteer_id)


@router.get("/volunteer-stats", summary="Volunteer impact stats")
async def volunteer_stats(volunteer_id: Optional[str] = None):
    """Get completed tasks, hours served, and total impact for a volunteer."""
    return await help_service.volunteer_stats(volunteer_id)


@router.post("/{task_id}/claim", status_code=status.HTTP_200_OK, summary="Claim a task")
async def claim_task(task_id: str, body: TaskClaim):
    """Assign the given volunteer to an open task."""
    return await help_service.claim_task(task_id, body.volunteer_id)


@router.patch("/{task_id}/progress", summary="Update task progress")
async def update_progress(task_id: str, body: TaskProgressUpdate):
    """Update a task's status and optional progress note."""
    return await help_service.update_task_progress(task_id, body)
