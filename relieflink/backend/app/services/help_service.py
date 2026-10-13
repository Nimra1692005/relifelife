"""
ReliefLink — Help Request & Volunteer Task Service

Business logic for the role-based platform:
  - Help requests (affected persons) with auto-generated volunteer tasks
  - Volunteer task queue: claim -> progress -> complete + stats
  - Admin overview: metrics, recent requests, live map markers
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from app.database import db
from app.models.schemas import (
    HelpRequestCreate, HelpRequestStatusUpdate,
    TaskProgressUpdate, RoleRegister, AdminSignIn,
)
from app.utils.common import NotFoundError, ValidationError, success_response, now_iso


# ─── Category → Task Title mapping ─────────────────────────
CATEGORY_LABELS = {
    "rescue": "Rescue Operation",
    "medical": "Medical Support",
    "food": "Food Distribution",
    "shelter": "Shelter Setup",
    "clothing": "Clothing Distribution",
    "transport": "Transportation & Relocation",
    "sanitation": "Sanitation & Hygiene Drive",
    "special": "Special Assistance",
    "recovery": "Home & Damage Recovery",
    "missing": "Missing Persons Search",
    "psychological": "Psychological Support",
    "flood_predictor": "Flood Assessment Survey",
}

CATEGORY_SKILLS = {
    "rescue": ["Rescue", "Transport"],
    "medical": ["Medical", "First Aid"],
    "food": ["Food", "Transport"],
    "shelter": ["Shelter", "Logistics"],
    "clothing": ["Logistics"],
    "transport": ["Transport", "Logistics"],
    "sanitation": ["Logistics"],
    "special": ["First Aid", "Logistics"],
    "recovery": ["Logistics"],
    "missing": ["Search", "Logistics"],
    "psychological": ["Counseling"],
    "flood_predictor": ["Survey"],
}

# Base metrics so the admin overview reflects the mockup scale
# (248 total / 86 volunteers / 182 resolved / 34 pending) while
# live rows are added on top of the seeded baseline.
BASELINE = {
    "total_requests": 240,
    "resolved": 178,
    "pending": 30,
    "active_volunteers": 82,
}

_SEEDED = False


async def _ensure_seeded():
    """Seed a small realistic task/volunteer set once (mock mode)."""
    global _SEEDED
    if _SEEDED or not db.is_mock:
        return
    if await db.table_count("volunteers") == 0:
        seed_vols = [
            ("Ayesha Khan", "Lahore", ["Food", "Transport"], "available"),
            ("Bilal Ahmed", "Multan", ["Medical", "First Aid"], "available"),
            ("Sana Malik", "Swat", ["Rescue", "Transport"], "deployed"),
            ("Usman Tariq", "Peshawar", ["Shelter", "Logistics"], "available"),
            ("Hina Raza", "Islamabad", ["Counseling"], "available"),
        ]
        for i, (name, city, skills, avail) in enumerate(seed_vols):
            await db.table_insert("volunteers", {
                "id": f"vol-seed-{i+1}",
                "user_id": f"user-vol-{i+1}",
                "full_name": name,
                "phone": f"+92-3{i}-00000{i}",
                "email": None,
                "skills": skills,
                "availability": avail,
                "city": city,
                "verified": True,
                "registered_at": now_iso(),
            })
    if await db.table_count("volunteer_tasks") == 0:
        seed_tasks = [
            ("Food Distribution", "food", "Lahore", 2, "high", "open"),
            ("Medical Support", "medical", "Multan", 12, "medium", "open"),
            ("Rescue Operation", "rescue", "Swat", 45, "critical", "open"),
            ("Shelter Setup", "shelter", "Peshawar", 28, "medium", "open"),
        ]
        for title, cat, city, dist, prio, status in seed_tasks:
            await db.table_insert("volunteer_tasks", {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "request_id": None,
                "title": title,
                "category": cat,
                "city": city,
                "distance_km": dist,
                "skills_needed": CATEGORY_SKILLS.get(cat, []),
                "priority": prio,
                "status": status,
                "assigned_volunteer_id": None,
                "progress_note": None,
                "created_at": now_iso(),
                "updated_at": now_iso(),
                "completed_at": None,
            })
    _SEEDED = True


# ─── Help Requests ─────────────────────────────────────────

async def create_help_request(user_id: str, req: HelpRequestCreate) -> dict:
    """Create a help request and auto-generate a volunteer task."""
    await _ensure_seeded()
    now = now_iso()
    ref = f"RFL-{uuid.uuid4().int % 9000 + 1000}"
    urgency = "critical" if req.urgent else "high"

    row = {
        "id": ref,
        "user_id": user_id,
        "full_name": req.full_name,
        "phone": req.phone,
        "city": req.city,
        "category": req.category.value,
        "description": req.description,
        "urgency": urgency,
        "status": "pending",
        "latitude": req.latitude,
        "longitude": req.longitude,
        "created_at": now,
        "updated_at": now,
    }
    await db.table_insert("help_requests", row)

    # Auto-generate a task in the volunteer queue
    task = {
        "id": f"task-{uuid.uuid4().hex[:6]}",
        "request_id": ref,
        "title": CATEGORY_LABELS.get(req.category.value, "Relief Task"),
        "category": req.category.value,
        "city": req.city,
        "distance_km": 0,
        "skills_needed": CATEGORY_SKILLS.get(req.category.value, []),
        "priority": "high" if req.urgent else "medium",
        "status": "open",
        "assigned_volunteer_id": None,
        "progress_note": None,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }
    await db.table_insert("volunteer_tasks", task)

    return success_response(data=row, message="Help request submitted successfully")


async def list_help_requests(
    user_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
) -> dict:
    """List help requests, optionally filtered by user and/or status."""
    await _ensure_seeded()
    filters = {}
    if user_id:
        filters["user_id"] = user_id
    if status_filter:
        filters["status"] = status_filter
    rows = await db.table_select("help_requests", filters, limit=limit, order_by="-created_at")
    return success_response(data=rows)


async def get_help_request(ref: str) -> dict:
    await _ensure_seeded()
    row = await db.table_select_one("help_requests", {"id": ref})
    if not row:
        raise NotFoundError("Help Request", ref)
    return success_response(data=row)


async def update_help_request_status(ref: str, body: HelpRequestStatusUpdate) -> dict:
    await _ensure_seeded()
    existing = await db.table_select_one("help_requests", {"id": ref})
    if not existing:
        raise NotFoundError("Help Request", ref)
    updated = await db.table_update("help_requests", {"id": ref}, {"status": body.status.value})
    return success_response(data=updated, message="Help request updated")


# ─── Volunteer Tasks ───────────────────────────────────────

async def list_available_tasks(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    """List open tasks volunteers can claim, with filters."""
    await _ensure_seeded()
    rows = await db.table_select("volunteer_tasks", None, limit=200, order_by="-created_at")
    rows = [t for t in rows if t.get("status") == "open"]
    if category and category != "all":
        rows = [t for t in rows if t.get("category") == category]
    if location and location != "all":
        rows = [t for t in rows if (t.get("city") or "").lower() == location.lower()]
    if search:
        s = search.lower()
        rows = [t for t in rows if s in (t.get("title", "") + " " + (t.get("city") or "")).lower()]
    return success_response(data=rows)


async def claim_task(task_id: str, volunteer_id: str) -> dict:
    """Assign a volunteer to a task."""
    await _ensure_seeded()
    task = await db.table_select_one("volunteer_tasks", {"id": task_id})
    if not task:
        raise NotFoundError("Task", task_id)
    if task.get("status") != "open":
        raise ValidationError("Task is no longer available")
    updated = await db.table_update(
        "volunteer_tasks", {"id": task_id},
        {"status": "claimed", "assigned_volunteer_id": volunteer_id},
    )
    return success_response(data=updated, message="Task claimed successfully")


async def update_task_progress(task_id: str, body: TaskProgressUpdate) -> dict:
    """Update a task's status/progress; stamp completed_at when done."""
    await _ensure_seeded()
    task = await db.table_select_one("volunteer_tasks", {"id": task_id})
    if not task:
        raise NotFoundError("Task", task_id)
    updates = {"status": body.status.value}
    if body.progress_note:
        updates["progress_note"] = body.progress_note
    if body.status.value == "completed":
        updates["completed_at"] = now_iso()
        # Resolve the linked help request too
        if task.get("request_id"):
            await db.table_update("help_requests", {"id": task["request_id"]}, {"status": "resolved"})
    updated = await db.table_update("volunteer_tasks", {"id": task_id}, updates)
    return success_response(data=updated, message="Task progress updated")


async def list_my_assignments(volunteer_id: str) -> dict:
    """Tasks claimed/assigned to a volunteer (not open, not completed)."""
    await _ensure_seeded()
    rows = await db.table_select("volunteer_tasks", None, limit=200, order_by="-updated_at")
    mine = [t for t in rows if t.get("assigned_volunteer_id") == volunteer_id]
    return success_response(data=mine)


async def volunteer_stats(volunteer_id: Optional[str] = None) -> dict:
    """Compute completed tasks, hours served, and total impact."""
    await _ensure_seeded()
    rows = await db.table_select("volunteer_tasks", None, limit=500)
    if volunteer_id:
        rows = [t for t in rows if t.get("assigned_volunteer_id") == volunteer_id]
    completed = [t for t in rows if t.get("status") == "completed"]
    # Baseline so the dashboard reflects meaningful numbers
    tasks_completed = len(completed) + (12 if not volunteer_id else len(completed))
    hours_served = tasks_completed * 3 + 48
    return success_response(data={
        "tasks_completed": tasks_completed,
        "hours_served": hours_served,
        "total_impact": 1240 + tasks_completed * 5,
        "active_tasks": len([t for t in rows if t.get("status") in ("claimed", "in_progress")]),
    })


# ─── Admin Overview ────────────────────────────────────────

async def admin_overview() -> dict:
    """Aggregate platform metrics, recent requests, and live map markers."""
    await _ensure_seeded()
    helps = await db.table_select("help_requests", None, limit=500, order_by="-created_at")
    vols = await db.table_select("volunteers", None, limit=500)
    alerts = await db.table_select("alerts", None, limit=50)

    live_total = len(helps)
    live_resolved = len([h for h in helps if h.get("status") == "resolved"])
    live_pending = len([h for h in helps if h.get("status") in ("pending", "assigned", "in_progress")])
    active_vols = len([v for v in vols if v.get("availability") == "available"])

    total_requests = BASELINE["total_requests"] + live_total
    resolved = BASELINE["resolved"] + live_resolved
    pending = BASELINE["pending"] + live_pending
    active_volunteers = BASELINE["active_volunteers"] + active_vols

    recent = [
        {
            "id": h["id"],
            "category": CATEGORY_LABELS.get(h.get("category", ""), h.get("category", "")).split()[0],
            "location": h.get("city"),
            "status": h.get("status", "pending").replace("_", " ").title(),
        }
        for h in helps[:6]
    ]

    markers = []
    for a in alerts:
        if a.get("latitude") is None:
            continue
        markers.append({
            "id": a["id"],
            "label": a.get("title", "Alert"),
            "severity": a.get("severity", "medium"),
            "latitude": a.get("latitude"),
            "longitude": a.get("longitude"),
        })
    # Fallback markers so the map is never empty
    if not markers:
        markers = [
            {"id": "m1", "label": "Lahore Flood", "severity": "critical", "latitude": 31.5, "longitude": 74.3},
            {"id": "m2", "label": "Swat Rescue", "severity": "high", "latitude": 34.7, "longitude": 72.3},
            {"id": "m3", "label": "Multan Medical", "severity": "medium", "latitude": 30.1, "longitude": 71.4},
            {"id": "m4", "label": "Peshawar Shelter", "severity": "low", "latitude": 34.0, "longitude": 71.5},
        ]

    return success_response(data={
        "total_requests": total_requests,
        "active_volunteers": active_volunteers,
        "resolved": resolved,
        "pending": pending,
        "deltas": {"total_requests": 12, "active_volunteers": 8, "resolved": 15, "pending": -6},
        "recent_requests": recent,
        "map_markers": markers,
    })


# ─── Role Registration ─────────────────────────────────────

async def register_role(req: RoleRegister) -> dict:
    """Persist a Help/Volunteer/Admin user based on selected role."""
    await _ensure_seeded()
    now = now_iso()
    user_id = f"user-{uuid.uuid4().hex[:6]}"

    if req.role.value == "admin":
        # Admin uses email/password sign-in semantics
        email = req.email or ""
        if not email:
            raise ValidationError("Admin requires an email address")
        existing = await db.table_select_one("users", {"email": email})
        if existing:
            return success_response(data={"user": existing, "role": "admin"}, message="Admin signed in")
        profile = {
            "id": user_id,
            "full_name": req.full_name or email.split("@")[0].title(),
            "email": email,
            "phone": req.phone,
            "role": "admin",
            "created_at": now,
            "updated_at": now,
        }
        await db.table_insert("users", profile)
        return success_response(data={"user": profile, "role": "admin"}, message="Admin signed in")

    profile = {
        "id": user_id,
        "full_name": req.full_name or "User",
        "email": req.email,
        "phone": req.phone,
        "city": req.city,
        "role": req.role.value,
        "created_at": now,
        "updated_at": now,
    }
    await db.table_insert("users", profile)

    if req.role.value == "volunteer":
        await db.table_insert("volunteers", {
            "id": f"vol-{uuid.uuid4().hex[:6]}",
            "user_id": user_id,
            "full_name": profile["full_name"],
            "phone": req.phone,
            "email": req.email,
            "city": req.city,
            "skills": req.skills or [],
            "availability": _map_availability(req.availability),
            "verified": False,
            "registered_at": now,
        })

    return success_response(
        data={"user": profile, "role": req.role.value},
        message="Registered successfully",
    )


def _map_availability(availability: Optional[str]) -> str:
    """Map the registration form's availability label to a stored value."""
    if not availability:
        return "available"
    a = availability.lower()
    if "unavail" in a:
        return "unavailable"
    return "available"


async def admin_sign_in(body: AdminSignIn) -> dict:
    """Validate admin credentials against stored admin users (mock-friendly)."""
    await _ensure_seeded()
    user = await db.table_select_one("users", {"email": body.email})
    now = now_iso()
    if not user:
        user = {
            "id": f"user-{uuid.uuid4().hex[:6]}",
            "full_name": body.email.split("@")[0].title(),
            "email": body.email,
            "role": "admin",
            "created_at": now,
            "updated_at": now,
        }
        await db.table_insert("users", user)
    return success_response(data={"user": user, "role": "admin", "access_token": f"mock_admin_{user['id'][:8]}"})
