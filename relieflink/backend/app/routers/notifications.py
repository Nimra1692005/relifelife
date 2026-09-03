"""
Notifications Router — User notification management

GET    /                    — List user notifications
PATCH  /{notif_id}/read     — Mark notification as read
"""

from fastapi import APIRouter

from app.database import db
from app.utils.common import success_response, NotFoundError

router = APIRouter()


# ─── Mock Notifications ──────────────────────────────────────
_SEED_NOTIFS = [
    {
        "id": "notif-001", "user_id": "user-001",
        "type": "sos_update", "title": "SOS Request Updated",
        "body": "Your SOS request #sos-001 has been assigned to Alpha Rescue Squad.",
        "is_read": False, "severity": "high",
        "action_type": "sos_detail", "created_at": "2026-08-27T07:15:00+00:00",
    },
    {
        "id": "notif-002", "user_id": "user-001",
        "type": "alert", "title": "Flood Warning — Your Area",
        "body": "A critical flood warning has been issued for Sector G-11. Consider evacuation.",
        "is_read": False, "severity": "critical",
        "action_type": "alert_detail", "created_at": "2026-08-27T06:00:00+00:00",
    },
    {
        "id": "notif-003", "user_id": "user-001",
        "type": "shelter", "title": "New Shelter Available",
        "body": "F-9 Park Community Hall now open with 155 available spots, 1.2 km away.",
        "is_read": True, "severity": "low",
        "action_type": "shelter_detail", "created_at": "2026-08-27T05:30:00+00:00",
    },
]

_SEED_DONE = False


async def _ensure_seeded():
    global _SEED_DONE
    if _SEED_DONE:
        return
    count = await db.table_count("notifications")
    if count == 0:
        for item in _SEED_NOTIFS:
            await db.table_insert("notifications", item.copy())
    _SEED_DONE = True


@router.get("", summary="List notifications")
async def list_notifications(user_id: str = "user-001"):
    """List all notifications for a user."""
    await _ensure_seeded()
    rows = await db.table_select("notifications", {"user_id": user_id}, order_by="-created_at")
    return success_response(data=rows)


@router.patch("/{notif_id}/read", summary="Mark as read")
async def mark_read(notif_id: str):
    """Mark a notification as read."""
    await _ensure_seeded()
    updated = await db.table_update("notifications", {"id": notif_id}, {"is_read": True})
    if not updated:
        raise NotFoundError("Notification", notif_id)
    return success_response(data=updated, message="Notification marked as read")
