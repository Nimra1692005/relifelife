"""
Disaster Alerts Router — Broadcast and manage disaster alerts

GET    /            — List all active alerts
POST   /            — Create a new alert (admin)
PATCH  /{alert_id}  — Update or deactivate an alert
"""

from fastapi import APIRouter, status

from app.models.schemas import AlertCreate
from app.database import db
from app.utils.common import success_response, NotFoundError, now_iso

router = APIRouter()


# ─── Mock Alert Seed ─────────────────────────────────────────
_SEED_ALERTS = [
    {
        "id": "alert-001",
        "title": "Severe Flood Warning — Islamabad Low-Lying Areas",
        "disaster_type": "flood",
        "severity": "critical",
        "description": "Nullah Lai water levels exceeding danger mark. Immediate evacuation required for sectors I-9, I-10, G-11 low areas.",
        "latitude": 33.6750,
        "longitude": 73.0350,
        "radius_km": 5.0,
        "location_text": "Nullah Lai Corridor, Islamabad",
        "is_active": True,
        "created_at": "2026-08-26T12:00:00+00:00",
        "updated_at": "2026-08-27T06:00:00+00:00",
    },
    {
        "id": "alert-002",
        "title": "Landslide Warning — Margalla Hills Foothills",
        "disaster_type": "landslide",
        "severity": "high",
        "description": "Continuous rainfall has saturated hillsides. Residents near Margalla foothills should prepare to evacuate.",
        "latitude": 33.7400,
        "longitude": 73.0200,
        "radius_km": 3.0,
        "location_text": "Margalla Hills, Islamabad",
        "is_active": True,
        "created_at": "2026-08-26T14:00:00+00:00",
        "updated_at": "2026-08-27T04:00:00+00:00",
    },
    {
        "id": "alert-003",
        "title": "Heavy Rain Advisory — Islamabad Capital Territory",
        "disaster_type": "storm",
        "severity": "medium",
        "description": "Heavy to very heavy rainfall expected to continue for next 12 hours. Avoid unnecessary travel.",
        "latitude": 33.7000,
        "longitude": 73.0400,
        "radius_km": 15.0,
        "location_text": "Islamabad Capital Territory",
        "is_active": True,
        "created_at": "2026-08-27T02:00:00+00:00",
        "updated_at": "2026-08-27T02:00:00+00:00",
    },
]


_SEED_DONE = False


async def _ensure_seeded():
    global _SEED_DONE
    if _SEED_DONE:
        return
    count = await db.table_count("alerts")
    if count == 0:
        for item in _SEED_ALERTS:
            await db.table_insert("alerts", item.copy())
    _SEED_DONE = True


@router.get("", summary="List active alerts")
async def list_alerts():
    """List all currently active disaster alerts."""
    await _ensure_seeded()
    rows = await db.table_select("alerts", {"is_active": True}, order_by="-created_at")
    return success_response(data=rows)


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create alert")
async def create_alert(body: AlertCreate):
    """Create and broadcast a new disaster alert (admin)."""
    await _ensure_seeded()
    data = body.model_dump()
    data["is_active"] = True
    row = await db.table_insert("alerts", data)
    return success_response(data=row, message="Alert created and broadcast")


@router.patch("/{alert_id}", summary="Update alert")
async def update_alert(alert_id: str, body: AlertCreate):
    """Update or deactivate an existing alert."""
    await _ensure_seeded()
    updated = await db.table_update("alerts", {"id": alert_id}, body.model_dump())
    if not updated:
        raise NotFoundError("Alert", alert_id)
    return success_response(data=updated, message="Alert updated")
