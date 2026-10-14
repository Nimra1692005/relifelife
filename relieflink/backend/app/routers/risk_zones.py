"""
Risk Zones Router — Disaster zone & risk analysis endpoints

GET    /             — List all active disaster zones
POST   /analyze      — Analyze risk for a specific location
POST   /safety-score — Calculate safety score for a location
"""

from fastapi import APIRouter

from app.models.schemas import RiskAnalysisRequest
from app.services import risk_service

router = APIRouter()


@router.get("", summary="List disaster zones")
async def list_risk_zones():
    """Get all currently active disaster/risk zones."""
    return await risk_service.get_disaster_zones()


@router.get("/assessment", summary="Risk assessment for a point (default: Islamabad)")
async def risk_assessment(latitude: float = 33.6844, longitude: float = 73.0479):
    return await risk_service.analyze_location(RiskAnalysisRequest(latitude=latitude, longitude=longitude))


@router.post("/analyze", summary="Analyze location risk")
async def analyze_risk(body: RiskAnalysisRequest):
    """Perform comprehensive risk analysis for a geographic location.
    Returns risk score, level, factors, nearby hazards, and recommendations."""
    return await risk_service.analyze_location(body)


@router.post("/safety-score", summary="Calculate safety score")
async def safety_score(body: RiskAnalysisRequest):
    """Calculate a safety score for a location (inverse of risk score)."""
    return await risk_service.calculate_safety_score(body)
