"""
Auth dependencies — verify Supabase access tokens and gate admin endpoints.

Admin = email listed in ADMIN_EMAILS env var, or users.role == "admin".
In development (mock DB) any mock token is accepted; in production the
mock DB is never trusted.
"""

import asyncio
from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from app.config import settings
from app.database import db


async def _resolve_user(token: str) -> Optional[dict]:
    if db.is_mock:
        if settings.environment.lower() == "production":
            return None
        if token.startswith("mock_token_"):
            return {"id": token[len("mock_token_"):], "email": "dev@local", "role": "admin"}
        return None

    try:
        res = await asyncio.to_thread(db.client.auth.get_user, token)
    except Exception:
        return None
    user = getattr(res, "user", None)
    if not user:
        return None

    email = (getattr(user, "email", "") or "").lower()
    role = "citizen"
    try:
        profile = await db.table_select_one("users", {"id": user.id})
        if profile:
            role = profile.get("role") or "citizen"
    except Exception:
        pass
    if email in settings.admin_email_list:
        role = "admin"
    return {"id": user.id, "email": email, "role": role}


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    user = await _resolve_user(authorization[7:].strip())
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user
