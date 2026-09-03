"""
ReliefLink — SOS Request Service

Manages the full lifecycle of emergency SOS requests:
  Create → Acknowledge → Assign Team → Dispatch → Resolve
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from app.database import db
from app.models.schemas import (
    SOSCreateRequest, SOSUpdateRequest, SOSAssignRequest,
    SOSStatus, SOSUrgency,
)
from app.utils.common import NotFoundError, ValidationError, success_response, now_iso


# ─── Mock Seed Data ──────────────────────────────────────────
_SEED_SOS = [
    {
        "id": "sos-001",
        "user_id": "user-001",
        "latitude": 33.6844,
        "longitude": 73.0479,
        "address_text": "House 45, Street 12, Sector G-11, Islamabad",
        "emergency_type": "flood",
        "disaster_type": "flood",
        "urgency": "critical",
        "message": "Water level rising rapidly, family of 5 trapped on ground floor",
        "status": "pending",
        "priority": "critical",
        "estimated_eta_minutes": None,
        "assigned_team_id": None,
        "assigned_team_name": None,
        "created_at": "2026-08-27T07:00:00+00:00",
        "updated_at": "2026-08-27T07:00:00+00:00",
        "resolved_at": None,
    },
    {
        "id": "sos-002",
        "user_id": "user-002",
        "latitude": 33.7200,
        "longitude": 73.0700,
        "address_text": "Block C, F-8 Markaz, Islamabad",
        "emergency_type": "medical",
        "disaster_type": None,
        "urgency": "high",
        "message": "Elderly person unconscious after flooding debris collapse",
        "status": "assigned",
        "priority": "high",
        "estimated_eta_minutes": 12,
        "assigned_team_id": "team-001",
        "assigned_team_name": "Alpha Rescue Squad",
        "created_at": "2026-08-27T06:45:00+00:00",
        "updated_at": "2026-08-27T07:10:00+00:00",
        "resolved_at": None,
    },
    {
        "id": "sos-003",
        "user_id": "user-003",
        "latitude": 33.6950,
        "longitude": 73.0200,
        "address_text": "Street 5, E-11/2, Islamabad",
        "emergency_type": "fire",
        "disaster_type": "fire",
        "urgency": "high",
        "message": "Electrical fire in residential building, 3 families inside",
        "status": "dispatched",
        "priority": "high",
        "estimated_eta_minutes": 5,
        "assigned_team_id": "team-002",
        "assigned_team_name": "Bravo Fire Unit",
        "created_at": "2026-08-27T06:30:00+00:00",
        "updated_at": "2026-08-27T07:05:00+00:00",
        "resolved_at": None,
    },
    {
        "id": "sos-004",
        "user_id": "user-004",
        "latitude": 33.7100,
        "longitude": 73.0550,
        "address_text": "Blue Area, Jinnah Avenue, Islamabad",
        "emergency_type": "earthquake",
        "disaster_type": "earthquake",
        "urgency": "medium",
        "message": "Building showing structural cracks after tremor",
        "status": "acknowledged",
        "priority": "medium",
        "estimated_eta_minutes": None,
        "assigned_team_id": None,
        "assigned_team_name": None,
        "created_at": "2026-08-27T06:20:00+00:00",
        "updated_at": "2026-08-27T06:50:00+00:00",
        "resolved_at": None,
    },
    {
        "id": "sos-005",
        "user_id": "user-005",
        "latitude": 33.6700,
        "longitude": 73.0300,
        "address_text": "I-10/3, Near Metro Station, Islamabad",
        "emergency_type": "flood",
        "disaster_type": "flood",
        "urgency": "low",
        "message": "Water entered ground floor, need sandbags",
        "status": "resolved",
        "priority": "low",
        "estimated_eta_minutes": 20,
        "assigned_team_id": "team-003",
        "assigned_team_name": "Charlie Support",
        "created_at": "2026-08-27T05:00:00+00:00",
        "updated_at": "2026-08-27T06:30:00+00:00",
        "resolved_at": "2026-08-27T06:30:00+00:00",
    },
]


class SOSService:

    def __init__(self):
        self._seeded = False

    async def _ensure_seeded(self):
        """Seed mock SOS data on first call."""
        if self._seeded:
            return
        count = await db.table_count("sos_requests")
        if count == 0:
            for item in _SEED_SOS:
                await db.table_insert("sos_requests", item.copy())
        self._seeded = True

    async def create(self, user_id: str, req: SOSCreateRequest) -> dict:
        """Create a new SOS emergency request."""
        await self._ensure_seeded()
        now = now_iso()
        sos_id = f"sos-{uuid.uuid4().hex[:6]}"

        # Auto-assign priority based on urgency
        priority = req.urgency.value

        # Estimate ETA based on urgency
        eta_map = {"critical": 8, "high": 15, "medium": 25, "low": 45}
        eta = eta_map.get(priority)

        data = {
            "id": sos_id,
            "user_id": user_id,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "address_text": req.address_text,
            "emergency_type": req.emergency_type.value if req.emergency_type else None,
            "disaster_type": req.disaster_type.value if req.disaster_type else None,
            "urgency": req.urgency.value,
            "message": req.message,
            "status": SOSStatus.pending.value,
            "priority": priority,
            "estimated_eta_minutes": eta,
            "assigned_team_id": None,
            "assigned_team_name": None,
            "created_at": now,
            "updated_at": now,
            "resolved_at": None,
        }
        row = await db.table_insert("sos_requests", data)
        return success_response(data=row, message="SOS request created successfully")

    async def list_all(
        self,
        status_filter: Optional[str] = None,
        urgency: Optional[str] = None,
        limit: int = 50,
    ) -> dict:
        """List SOS requests with optional filters."""
        await self._ensure_seeded()
        filters = {}
        if status_filter:
            filters["status"] = status_filter
        if urgency:
            filters["urgency"] = urgency

        rows = await db.table_select("sos_requests", filters, limit=limit, order_by="-created_at")
        return success_response(data=rows)

    async def get_by_id(self, sos_id: str) -> dict:
        """Get a specific SOS request."""
        await self._ensure_seeded()
        row = await db.table_select_one("sos_requests", {"id": sos_id})
        if not row:
            raise NotFoundError("SOS Request", sos_id)
        return success_response(data=row)

    async def update(self, sos_id: str, req: SOSUpdateRequest) -> dict:
        """Update SOS request status or assignment."""
        await self._ensure_seeded()
        existing = await db.table_select_one("sos_requests", {"id": sos_id})
        if not existing:
            raise NotFoundError("SOS Request", sos_id)

        updates = {}
        if req.status is not None:
            updates["status"] = req.status.value
            if req.status == SOSStatus.resolved:
                updates["resolved_at"] = now_iso()
        if req.priority is not None:
            updates["priority"] = req.priority.value
        if req.assigned_team_id is not None:
            updates["assigned_team_id"] = req.assigned_team_id
            # Look up team name
            team = await db.table_select_one("rescue_teams", {"id": req.assigned_team_id})
            if team:
                updates["assigned_team_name"] = team["name"]
            updates["status"] = SOSStatus.assigned.value
        if req.notes is not None:
            updates["notes"] = req.notes

        updated = await db.table_update("sos_requests", {"id": sos_id}, updates)
        return success_response(data=updated, message="SOS request updated")

    async def assign_team(self, sos_id: str, req: SOSAssignRequest) -> dict:
        """Assign a rescue team to an SOS request."""
        await self._ensure_seeded()
        sos = await db.table_select_one("sos_requests", {"id": sos_id})
        if not sos:
            raise NotFoundError("SOS Request", sos_id)

        team = await db.table_select_one("rescue_teams", {"id": req.team_id})
        if not team:
            raise NotFoundError("Rescue Team", req.team_id)

        updates = {
            "assigned_team_id": req.team_id,
            "assigned_team_name": team["name"],
            "status": SOSStatus.assigned.value,
            "estimated_eta_minutes": 10,
        }
        updated = await db.table_update("sos_requests", {"id": sos_id}, updates)

        # Update team status to dispatched
        await db.table_update("rescue_teams", {"id": req.team_id}, {
            "status": "dispatched",
            "active_assignments": team.get("active_assignments", 0) + 1,
        })

        return success_response(data=updated, message=f"Team '{team['name']}' assigned")

    async def get_stats(self) -> dict:
        """Get SOS request statistics."""
        await self._ensure_seeded()
        all_sos = await db.table_select("sos_requests")
        active = [s for s in all_sos if s["status"] not in ("resolved", "cancelled")]
        pending = [s for s in all_sos if s["status"] == "pending"]
        resolved = [s for s in all_sos if s["status"] == "resolved"]

        return {
            "total": len(all_sos),
            "active": len(active),
            "pending": len(pending),
            "resolved": len(resolved),
            "critical": len([s for s in active if s.get("priority") == "critical"]),
        }


# Singleton
sos_service = SOSService()
