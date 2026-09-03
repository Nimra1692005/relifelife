"""
ReliefLink — Supabase Database Client

Production: Connects to Supabase for auth, PostgreSQL, realtime, storage.
Development: Falls back to in-memory mock when Supabase is not configured.

Swap strategy:
  - All services use this client's interface
  - Replace mock methods with real Supabase calls for production
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

from app.config import settings


class SupabaseClient:
    """
    Supabase client wrapper. Uses in-memory storage when credentials
    are not configured (development mode).
    """

    def __init__(self):
        self._client = None
        self._is_mock = not (settings.supabase_url and settings.supabase_key)

        if not self._is_mock:
            try:
                from supabase import create_client
                self._client = create_client(
                    settings.supabase_url,
                    settings.supabase_service_key or settings.supabase_key,
                )
            except Exception:
                self._is_mock = True

        # In-memory mock storage
        self._store: Dict[str, List[Dict[str, Any]]] = {
            "users": [],
            "sos_requests": [],
            "shelters": [],
            "hospitals": [],
            "rescue_teams": [],
            "volunteers": [],
            "alerts": [],
            "risk_zones": [],
            "notifications": [],
            "user_locations": [],
        }

    @property
    def is_mock(self) -> bool:
        return self._is_mock

    @property
    def client(self):
        """Get the raw Supabase client (None in mock mode)."""
        return self._client

    # ─── Auth ─────────────────────────────────────────────

    async def auth_sign_up(self, email: str, password: str, metadata: dict = None) -> dict:
        if self._is_mock:
            user_id = str(uuid.uuid4())
            return {
                "user": {
                    "id": user_id,
                    "email": email,
                    "user_metadata": metadata or {},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
                "session": {
                    "access_token": f"mock_token_{user_id[:8]}",
                    "refresh_token": f"mock_refresh_{user_id[:8]}",
                    "expires_in": 3600,
                },
            }
        result = self._client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": metadata or {}},
        })
        return {"user": result.user.model_dump(), "session": result.session.model_dump()}

    async def auth_sign_in(self, email: str, password: str) -> dict:
        if self._is_mock:
            user_id = str(uuid.uuid4())
            return {
                "user": {"id": user_id, "email": email},
                "session": {
                    "access_token": f"mock_token_{user_id[:8]}",
                    "refresh_token": f"mock_refresh_{user_id[:8]}",
                    "expires_in": 3600,
                },
            }
        result = self._client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        return {"user": result.user.model_dump(), "session": result.session.model_dump()}

    # ─── Table Operations ─────────────────────────────────

    async def table_insert(self, table: str, data: dict) -> dict:
        """Insert a row into a table."""
        if self._is_mock:
            row = {"id": data.get("id") or str(uuid.uuid4()), **data}
            row.setdefault("created_at", datetime.now(timezone.utc).isoformat())
            row.setdefault("updated_at", datetime.now(timezone.utc).isoformat())
            self._store.setdefault(table, []).append(row)
            return row
        result = self._client.table(table).insert(data).execute()
        return result.data[0] if result.data else {}

    async def table_select(self, table: str, filters: dict = None, limit: int = 100, order_by: str = None) -> list:
        """Select rows from a table with optional filters."""
        if self._is_mock:
            rows = self._store.get(table, [])
            if filters:
                rows = [
                    r for r in rows
                    if all(r.get(k) == v for k, v in filters.items())
                ]
            if order_by:
                reverse = order_by.startswith("-")
                key = order_by.lstrip("-")
                rows = sorted(rows, key=lambda r: r.get(key, ""), reverse=reverse)
            return rows[:limit]
        query = self._client.table(table).select("*")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        if order_by:
            desc = order_by.startswith("-")
            key = order_by.lstrip("-")
            query = query.order(key, desc=desc)
        query = query.limit(limit)
        result = query.execute()
        return result.data or []

    async def table_select_one(self, table: str, filters: dict) -> Optional[dict]:
        """Select a single row."""
        rows = await self.table_select(table, filters, limit=1)
        return rows[0] if rows else None

    async def table_update(self, table: str, filters: dict, data: dict) -> Optional[dict]:
        """Update rows matching filters."""
        if self._is_mock:
            rows = self._store.get(table, [])
            for row in rows:
                if all(row.get(k) == v for k, v in filters.items()):
                    row.update(data)
                    row["updated_at"] = datetime.now(timezone.utc).isoformat()
                    return row
            return None
        query = self._client.table(table)
        for key, value in filters.items():
            query = query.eq(key, value)
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = query.update(data).execute()
        return result.data[0] if result.data else None

    async def table_delete(self, table: str, filters: dict) -> bool:
        """Delete rows matching filters."""
        if self._is_mock:
            before = len(self._store.get(table, []))
            self._store[table] = [
                r for r in self._store.get(table, [])
                if not all(r.get(k) == v for k, v in filters.items())
            ]
            return len(self._store[table]) < before
        query = self._client.table(table)
        for key, value in filters.items():
            query = query.eq(key, value)
        result = query.delete().execute()
        return bool(result.data)

    async def table_count(self, table: str, filters: dict = None) -> int:
        """Count rows in a table."""
        if self._is_mock:
            rows = self._store.get(table, [])
            if filters:
                rows = [r for r in rows if all(r.get(k) == v for k, v in filters.items())]
            return len(rows)
        query = self._client.table(table).select("*", count="exact")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        result = query.execute()
        return result.count or 0


# Singleton
db = SupabaseClient()
