"""
ReliefLink — Authentication Service

Handles user registration, login, OTP, and profile management.
Uses Supabase Auth in production, mock tokens in development.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.database import db
from app.models.schemas import (
    SignUpRequest, LoginRequest, ProfileUpdateRequest,
    UserProfile, AuthResponse,
)
from app.utils.common import (
    AuthenticationError, NotFoundError, ValidationError,
    success_response, now_iso,
)


# ─── Mock OTP Store ──────────────────────────────────────────
_otp_store: dict = {}  # phone -> {"code": "123456", "expires": ...}


class AuthService:

    async def register(self, req: SignUpRequest) -> dict:
        """Register a new user with Supabase Auth."""
        # Check for duplicate email
        existing = await db.table_select_one("users", {"email": req.email})
        if existing:
            raise ValidationError("Email already registered")

        # Create Supabase auth user
        auth_result = await db.auth_sign_up(
            email=req.email,
            password=req.password,
            metadata={"full_name": req.full_name, "role": req.role.value},
        )

        user_id = auth_result["user"]["id"]
        now = now_iso()

        # Create user profile in database
        profile = {
            "id": user_id,
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone,
            "role": req.role.value,
            "blood_group": None,
            "emergency_contact": None,
            "avatar_url": None,
            "language_pref": "en",
            "created_at": now,
            "updated_at": now,
        }
        await db.table_insert("users", profile)

        return success_response(data={
            "user": profile,
            "access_token": auth_result["session"]["access_token"],
            "refresh_token": auth_result["session"]["refresh_token"],
            "expires_in": auth_result["session"]["expires_in"],
        })

    async def login(self, req: LoginRequest) -> dict:
        """Authenticate user with email/password."""
        try:
            auth_result = await db.auth_sign_in(
                email=req.email,
                password=req.password,
            )
        except Exception:
            raise AuthenticationError("Invalid email or password")

        user_id = auth_result["user"]["id"]

        # Get user profile
        profile = await db.table_select_one("users", {"id": user_id})
        if not profile:
            # Create a default profile for mock auth
            now = now_iso()
            profile = {
                "id": user_id,
                "full_name": req.email.split("@")[0].title(),
                "email": req.email,
                "phone": None,
                "role": "citizen",
                "blood_group": None,
                "emergency_contact": None,
                "avatar_url": None,
                "language_pref": "en",
                "created_at": now,
                "updated_at": now,
            }
            await db.table_insert("users", profile)

        return success_response(data={
            "user": profile,
            "access_token": auth_result["session"]["access_token"],
            "refresh_token": auth_result["session"]["refresh_token"],
            "expires_in": auth_result["session"]["expires_in"],
        })

    async def send_otp(self, phone: str) -> dict:
        """Send OTP code to phone number."""
        code = "123456"  # Mock OTP
        _otp_store[phone] = {
            "code": code,
            "expires": datetime.now(timezone.utc).timestamp() + 300,  # 5 min
        }
        # In production: integrate with Twilio/SMS gateway
        return success_response(message=f"OTP sent to {phone}")

    async def verify_otp(self, phone: str, code: str) -> dict:
        """Verify OTP code and return auth session."""
        stored = _otp_store.get(phone)
        if not stored:
            raise AuthenticationError("No OTP found for this phone")

        if stored["expires"] < datetime.now(timezone.utc).timestamp():
            del _otp_store[phone]
            raise AuthenticationError("OTP expired")

        if stored["code"] != code:
            raise AuthenticationError("Invalid OTP code")

        del _otp_store[phone]

        # Create or find user by phone
        user = await db.table_select_one("users", {"phone": phone})
        if not user:
            user_id = str(uuid.uuid4())
            now = now_iso()
            user = {
                "id": user_id,
                "full_name": "User",
                "email": f"{user_id[:8]}@relieflink.pk",
                "phone": phone,
                "role": "citizen",
                "blood_group": None,
                "emergency_contact": None,
                "avatar_url": None,
                "language_pref": "en",
                "created_at": now,
                "updated_at": now,
            }
            await db.table_insert("users", user)

        return success_response(data={
            "user": user,
            "access_token": f"mock_token_{user['id'][:8]}",
            "refresh_token": f"mock_refresh_{user['id'][:8]}",
            "expires_in": 3600,
        })

    async def get_profile(self, user_id: str) -> dict:
        """Get user profile by ID."""
        profile = await db.table_select_one("users", {"id": user_id})
        if not profile:
            raise NotFoundError("User", user_id)
        return success_response(data=profile)

    async def update_profile(self, user_id: str, req: ProfileUpdateRequest) -> dict:
        """Update user profile fields."""
        updates = req.model_dump(exclude_none=True)
        if not updates:
            raise ValidationError("No fields to update")

        updated = await db.table_update("users", {"id": user_id}, updates)
        if not updated:
            raise NotFoundError("User", user_id)

        return success_response(data=updated, message="Profile updated")


# Singleton
auth_service = AuthService()
