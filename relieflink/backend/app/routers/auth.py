"""
Auth Router — User registration, login, OTP, profile management

POST /signup        — Register new user
POST /login         — Authenticate with email/password
POST /otp/send      — Send OTP to phone
POST /otp/verify    — Verify OTP and authenticate
GET  /profile/{id}  — Get user profile
PATCH /profile/{id} — Update user profile
"""

from fastapi import APIRouter

from app.models.schemas import (
    SignUpRequest, LoginRequest,
    OTPSendRequest, OTPVerifyRequest,
    ProfileUpdateRequest,
)
from app.services import auth_service

router = APIRouter()


@router.post("/signup", summary="Register a new user")
async def sign_up(body: SignUpRequest):
    """Register a new user with Supabase Auth and create their profile."""
    return await auth_service.register(body)


@router.post("/login", summary="Authenticate user")
async def login(body: LoginRequest):
    """Authenticate user with email and password."""
    return await auth_service.login(body)


@router.post("/otp/send", summary="Send OTP code")
async def send_otp(body: OTPSendRequest):
    """Send a one-time password to the user's phone number."""
    return await auth_service.send_otp(body.phone)


@router.post("/otp/verify", summary="Verify OTP code")
async def verify_otp(body: OTPVerifyRequest):
    """Verify OTP code and return authentication session."""
    return await auth_service.verify_otp(body.phone, body.code)


@router.get("/profile/{user_id}", summary="Get user profile")
async def get_profile(user_id: str):
    """Get the full profile for a user by ID."""
    return await auth_service.get_profile(user_id)


@router.patch("/profile/{user_id}", summary="Update user profile")
async def update_profile(user_id: str, body: ProfileUpdateRequest):
    """Update user profile fields (name, phone, blood group, etc)."""
    return await auth_service.update_profile(user_id, body)
