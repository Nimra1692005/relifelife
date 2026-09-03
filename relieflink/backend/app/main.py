"""
ReliefLink — FastAPI Backend
AI-Powered Disaster Emergency Response Platform for Pakistan

Architecture:
  app/
    database/   — Supabase client (auth, PostgreSQL, realtime, storage)
    models/     — Pydantic schemas (TypeScript-compatible JSON)
    services/   — Business logic layer
    routers/    — API endpoint definitions
    ai/         — AI chatbot & risk analysis engine
    utils/      — Geospatial, error handling, response helpers
    middleware/  — Request logging, rate limiting
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.utils.common import register_error_handlers
from app.database import db
from app.routers import (
    auth,
    alerts,
    shelters,
    hospitals,
    sos,
    risk_zones,
    teams,
    volunteers,
    ai,
    safe_routes,
    analytics,
    notifications,
    locations,
    weather,
    travel,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Startup
    print(f"🚀 ReliefLink API starting — env: {settings.environment}")
    print(f"📦 Database: {'Mock (in-memory)' if db.is_mock else '✅ Supabase connected'}")
    print(f"🤖 AI Provider: Mock (no API key configured)" if not settings.openai_api_key else f"🤖 AI Provider: OpenAI ({settings.openai_model})")
    weather_mode = 'Mock data' if settings.weather_provider == 'mock' or not settings.weather_api_key else f'✅ {settings.weather_provider}'
    print(f"🌦️ Weather Intelligence: {weather_mode}")
    print(f"🌐 CORS: {settings.get_cors_origins()}")
    yield
    # Shutdown
    print("🛑 ReliefLink API shutting down")


app = FastAPI(
    title="ReliefLink API",
    description="""
## AI-Powered Disaster Emergency Response Platform for Pakistan

ReliefLink provides a complete backend for managing disaster emergencies:

- **Authentication** — Supabase Auth with email/password and OTP
- **SOS Requests** — Full lifecycle: create → acknowledge → assign team → dispatch → resolve
- **Locations** — GPS tracking, nearby shelters/hospitals/safe-places
- **Risk Analysis** — AI-powered risk scoring with hazard proximity
- **Resources** — Shelters, hospitals, rescue teams, volunteers
- **AI Assistant** — Multi-language emergency chatbot (English, Urdu, Roman Urdu)
- **Analytics** — Dashboard stats, disaster breakdown, response metrics
- **Safe Routes** — Navigation avoiding active disaster zones

### Architecture
All services use a pluggable database layer. In development, an in-memory mock
store is used. In production, Supabase provides PostgreSQL, auth, realtime, and storage.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── Error Handlers ──────────────────────────────────────────
register_error_handlers(app)

# ─── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(sos.router, prefix="/api/v1/sos", tags=["SOS Requests"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(shelters.router, prefix="/api/v1/shelters", tags=["Shelters"])
app.include_router(hospitals.router, prefix="/api/v1/hospitals", tags=["Hospitals"])
app.include_router(teams.router, prefix="/api/v1/teams", tags=["Rescue Teams"])
app.include_router(volunteers.router, prefix="/api/v1/volunteers", tags=["Volunteers"])
app.include_router(risk_zones.router, prefix="/api/v1/risk-zones", tags=["Risk Zones"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Disaster Alerts"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Assistant"])
app.include_router(safe_routes.router, prefix="/api/v1/safe-route", tags=["Safe Routes"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["Weather Intelligence"])
app.include_router(travel.router, prefix="/api/v1/travel", tags=["Travel Safety"])


# ─── Health Check ────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """API root — service info and health status."""
    return {
        "status": "online",
        "service": "ReliefLink API",
        "version": "1.0.0",
        "environment": settings.environment,
        "database": "mock" if db.is_mock else "supabase",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check with dependency status."""
    return {
        "status": "healthy",
        "database": "mock" if db.is_mock else "supabase",
        "weather": "mock" if settings.weather_provider == "mock" or not settings.weather_api_key else settings.weather_provider,
        "ai_provider": "openai" if settings.openai_api_key else "mock",
    }
