"""
ReliefLink — Common Utilities & Error Handling

Provides:
- Standard API response wrappers
- Custom exception classes
- Error handler registration
- Validation helpers
"""

from typing import Any, Optional, List
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


# ─── Standard Response Models ───────────────────────────────

class APIResponse(BaseModel):
    """Standard API response wrapper (TypeScript-compatible)."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None
    meta: Optional[dict] = None


class PaginatedResponse(BaseModel):
    """Paginated list response."""
    success: bool = True
    data: List[Any]
    total: int
    page: int = 1
    per_page: int = 50
    has_more: bool = False


# ─── Custom Exceptions ──────────────────────────────────────

class ReliefLinkError(Exception):
    """Base exception for ReliefLink API."""
    def __init__(self, message: str, status_code: int = 400, code: str = "ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class NotFoundError(ReliefLinkError):
    def __init__(self, resource: str, identifier: str = ""):
        msg = f"{resource} not found" + (f": {identifier}" if identifier else "")
        super().__init__(msg, status_code=404, code="NOT_FOUND")


class AuthenticationError(ReliefLinkError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401, code="UNAUTHORIZED")


class ValidationError(ReliefLinkError):
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=422, code="VALIDATION_ERROR")


class RateLimitError(ReliefLinkError):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429, code="RATE_LIMITED")


class ServiceUnavailableError(ReliefLinkError):
    def __init__(self, service: str = "external service"):
        super().__init__(f"{service} is temporarily unavailable", status_code=503, code="SERVICE_UNAVAILABLE")


# ─── Error Handler Registration ─────────────────────────────

def register_error_handlers(app: FastAPI):
    """Register custom error handlers for consistent API responses."""

    @app.exception_handler(ReliefLinkError)
    async def relieflink_error_handler(request: Request, exc: ReliefLinkError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.code,
                "message": exc.message,
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            },
        )


# ─── Helper Functions ───────────────────────────────────────

def now_iso() -> str:
    """Current UTC time as ISO string."""
    return datetime.now(timezone.utc).isoformat()


def success_response(data: Any = None, message: str = None) -> dict:
    """Build a success response."""
    return {
        "success": True,
        "data": data,
        "message": message,
    }


def error_response(error: str, message: str = None, status_code: int = 400) -> dict:
    """Build an error response."""
    return {
        "success": False,
        "error": error,
        "message": message,
    }


def paginate(items: list, page: int = 1, per_page: int = 50) -> dict:
    """Paginate a list of items."""
    start = (page - 1) * per_page
    end = start + per_page
    sliced = items[start:end]
    return {
        "success": True,
        "data": sliced,
        "total": len(items),
        "page": page,
        "per_page": per_page,
        "has_more": end < len(items),
    }
