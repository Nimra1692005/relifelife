"""
ReliefLink — Pydantic Schemas

All request/response schemas for the API. TypeScript-compatible JSON output.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────

class UserRole(str, Enum):
    citizen = "citizen"
    admin = "admin"
    responder = "responder"
    volunteer = "volunteer"


class SOSStatus(str, Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    assigned = "assigned"
    dispatched = "dispatched"
    resolved = "resolved"
    cancelled = "cancelled"


class SOSUrgency(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class EmergencyType(str, Enum):
    flood = "flood"
    fire = "fire"
    medical = "medical"
    earthquake = "earthquake"
    landslide = "landslide"
    security = "security"
    storm = "storm"
    other = "other"


class AlertSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RiskLevel(str, Enum):
    safe = "safe"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TeamStatus(str, Enum):
    available = "available"
    dispatched = "dispatched"
    busy = "busy"
    offline = "offline"


class DisasterType(str, Enum):
    flood = "flood"
    earthquake = "earthquake"
    fire = "fire"
    landslide = "landslide"
    storm = "storm"
    extreme_rain = "extreme_rain"


# ─── Auth Schemas ────────────────────────────────────────────

class SignUpRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.citizen


class LoginRequest(BaseModel):
    email: str
    password: str


class OTPSendRequest(BaseModel):
    phone: str = Field(..., max_length=20)


class OTPVerifyRequest(BaseModel):
    phone: str
    code: str = Field(..., min_length=4, max_length=6)


class UserProfile(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    avatar_url: Optional[str] = None
    language_pref: str = "en"
    created_at: str
    updated_at: str


class AuthResponse(BaseModel):
    user: UserProfile
    access_token: str
    refresh_token: str
    expires_in: int


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    language_pref: Optional[str] = None


# ─── SOS Schemas ─────────────────────────────────────────────

class SOSCreateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address_text: Optional[str] = None
    emergency_type: Optional[EmergencyType] = None
    disaster_type: Optional[DisasterType] = None
    urgency: SOSUrgency = SOSUrgency.high
    message: Optional[str] = Field(None, max_length=500)


class SOSUpdateRequest(BaseModel):
    status: Optional[SOSStatus] = None
    assigned_team_id: Optional[str] = None
    priority: Optional[SOSUrgency] = None
    notes: Optional[str] = None


class SOSResponse(BaseModel):
    id: str
    user_id: str
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    emergency_type: Optional[str] = None
    disaster_type: Optional[str] = None
    urgency: str
    message: Optional[str] = None
    status: str
    priority: Optional[str] = None
    estimated_eta_minutes: Optional[int] = None
    assigned_team_id: Optional[str] = None
    assigned_team_name: Optional[str] = None
    created_at: str
    updated_at: str
    resolved_at: Optional[str] = None


class SOSAssignRequest(BaseModel):
    team_id: str
    notes: Optional[str] = None


# ─── Location Schemas ────────────────────────────────────────

class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy_meters: Optional[float] = None
    address_text: Optional[str] = None


class NearbyRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(10.0, ge=0.1, le=100)
    limit: int = Field(20, ge=1, le=100)


class NearbyPlace(BaseModel):
    id: str
    name: str
    type: str  # shelter | hospital | rescue_center | safe_zone
    latitude: float
    longitude: float
    distance_km: float
    distance_display: str
    address: Optional[str] = None
    capacity: Optional[int] = None
    available_spots: Optional[int] = None
    phone: Optional[str] = None
    safety_score: Optional[int] = None


# ─── Resource Schemas ────────────────────────────────────────

class ShelterCreate(BaseModel):
    name: str = Field(..., min_length=2)
    latitude: float
    longitude: float
    address: Optional[str] = None
    capacity: int = Field(100, ge=1)
    type: str = "shelter"
    phone: Optional[str] = None
    facilities: Optional[List[str]] = None


class ShelterResponse(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    capacity: int
    current_occupancy: int = 0
    available_spots: int = 0
    type: str
    phone: Optional[str] = None
    facilities: List[str] = []
    is_active: bool = True
    created_at: str
    updated_at: str


class HospitalCreate(BaseModel):
    name: str = Field(..., min_length=2)
    latitude: float
    longitude: float
    address: Optional[str] = None
    beds_available: int = Field(0, ge=0)
    phone: Optional[str] = None
    emergency_capable: bool = True


class HospitalResponse(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    beds_available: int
    phone: Optional[str] = None
    emergency_capable: bool
    is_active: bool = True
    created_at: str
    updated_at: str


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2)
    team_type: str = "rescue"
    leader_name: str
    member_count: int = Field(1, ge=1)
    phone: Optional[str] = None
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None


class TeamResponse(BaseModel):
    id: str
    name: str
    team_type: str
    leader_name: str
    member_count: int
    phone: Optional[str] = None
    status: str
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    active_assignments: int = 0
    created_at: str
    updated_at: str


class VolunteerRegister(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone: str
    email: Optional[str] = None
    skills: Optional[List[str]] = None
    availability: str = "weekends"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VolunteerResponse(BaseModel):
    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    skills: List[str] = []
    availability: str
    is_active: bool = True
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: str


# ─── Risk Schemas ────────────────────────────────────────────

class RiskAnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class RiskFactor(BaseModel):
    type: str
    label: str
    level: str
    weight: float
    score: float
    description: str


class HazardZone(BaseModel):
    id: str
    type: str
    severity: str
    label: str
    description: str
    latitude: float
    longitude: float
    radius_meters: int
    distance_km: Optional[float] = None


class RiskAnalysisResponse(BaseModel):
    overall_score: int
    level: str
    label: str
    description: str
    factors: List[RiskFactor]
    nearby_hazards: List[HazardZone]
    recommendation: str
    analyzed_at: str


class SafetyScoreResponse(BaseModel):
    score: int
    level: str
    label: str
    description: str
    location: str
    analyzed_at: str


class DisasterZoneResponse(BaseModel):
    id: str
    type: str
    severity: str
    label: str
    description: str
    latitude: float
    longitude: float
    radius_meters: int
    is_active: bool = True
    created_at: str


# ─── Alert Schemas ───────────────────────────────────────────

class AlertCreate(BaseModel):
    title: str = Field(..., min_length=5)
    disaster_type: DisasterType
    severity: AlertSeverity
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    location_text: Optional[str] = None


class AlertResponse(BaseModel):
    id: str
    title: str
    disaster_type: str
    severity: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    location_text: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str


# ─── Analytics Schemas ───────────────────────────────────────

class OverviewStats(BaseModel):
    active_emergencies: int
    people_needing_help: int
    high_risk_areas: int
    available_teams: int
    total_teams: int
    shelters_active: int
    shelters_total_capacity: int
    sos_today: int
    sos_resolved_today: int
    avg_response_time_min: float
    people_evacuated: int


class DisasterBreakdown(BaseModel):
    type: str
    count: int
    percentage: float


class ResponseTimeMetrics(BaseModel):
    average_min: float
    fastest_min: float
    slowest_min: float
    within_10min_pct: float


# ─── Notification Schemas ────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    is_read: bool
    severity: Optional[str] = None
    action_type: Optional[str] = None
    created_at: str


# ─── Weather Intelligence Schemas ───────────────────────────

class WeatherConditionEnum(str, Enum):
    clear = "clear"
    partly_cloudy = "partly_cloudy"
    cloudy = "cloudy"
    light_rain = "light_rain"
    heavy_rain = "heavy_rain"
    thunderstorm = "thunderstorm"
    drizzle = "drizzle"
    fog = "fog"


class WeatherSeverityEnum(str, Enum):
    normal = "normal"
    advisory = "advisory"
    warning = "warning"
    severe = "severe"


class CurrentWeatherResponse(BaseModel):
    temperature: float
    feels_like: float
    condition: str
    condition_label: str
    humidity: int
    wind_speed: float
    wind_direction: str
    rain_probability: int
    visibility: float
    pressure: int
    icon: str


class HourlyForecastResponse(BaseModel):
    hour: str
    temp: int
    condition: str
    condition_label: str
    rain_probability: int
    icon: str


class DailyForecastResponse(BaseModel):
    day: str
    date: str
    high_temp: int
    low_temp: int
    condition: str
    condition_label: str
    rain_probability: int
    icon: str


class WeatherWarningResponse(BaseModel):
    id: str
    severity: str
    title: str
    description: str
    action: str
    icon: str


class WeatherDataResponse(BaseModel):
    location: str
    source: str
    current: CurrentWeatherResponse
    hourly_forecast: List[HourlyForecastResponse]
    daily_forecast: List[DailyForecastResponse]
    warnings: List[WeatherWarningResponse]
    fetched_at: str


class WeatherRequest(BaseModel):
    latitude: float = Field(default=33.6844, description="Latitude")
    longitude: float = Field(default=73.0479, description="Longitude")


class CombinedRiskFactorResponse(BaseModel):
    id: str
    type: str
    label: str
    severity: str
    description: str
    impact: int


class CombinedRiskResponse(BaseModel):
    overall_score: int
    level: str
    label: str
    description: str
    factors: List[CombinedRiskFactorResponse]
    recommendation: str
    disclaimer: str
    analyzed_at: str


class RouteSafetyRequest(BaseModel):
    from_lat: float = Field(default=33.6844)
    from_lng: float = Field(default=73.0479)
    to_lat: float = Field(default=33.6998)
    to_lng: float = Field(default=73.0125)
    from_label: str = Field(default="Current Location")
    to_label: str = Field(default="F-11 Community Center")


class RouteHazardResponse(BaseModel):
    id: str
    type: str
    label: str
    severity: str
    description: str
    distance_km: float


class RouteWeatherResponse(BaseModel):
    condition: str
    icon: str
    rain_probability: int
    temperature: float
    areas: List[str]


class RouteAnalysisResponse(BaseModel):
    id: str
    name: str
    distance_km: float
    distance_display: str
    estimated_minutes: int
    estimated_time_display: str
    safety_score: int
    safety_level: str
    safety_label: str
    weather: RouteWeatherResponse
    hazards: List[RouteHazardResponse]
    blocked_roads: int
    risky_points: int
    is_recommended: bool
    recommendation: str


class RouteSafetyResponse(BaseModel):
    origin: dict
    destination: dict
    primary_route: RouteAnalysisResponse
    alternative_route: Optional[RouteAnalysisResponse] = None
    safer_alternative_available: bool
    analyzed_at: str
    disclaimer: str
