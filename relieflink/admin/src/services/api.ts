/**
 * ReliefLink — API Client
 * Connects admin dashboard to the FastAPI backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Types ─────────────────────────────────────────────
export interface SOSRequest {
  id: string;
  type: string;
  icon: string;
  name: string;
  location: string;
  time: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'assigned' | 'dispatched' | 'resolved';
  lat: number;
  lng: number;
}

export interface RiskAssessment {
  overall_score: number;
  level: string;
  affected_area: string;
  affected_population: string;
  primary_threat: string;
  time_window: string;
  recommendations: { severity: string; text: string }[];
}

export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    icon: string;
    rain: number;
    humidity: number;
    wind_speed: number;
  };
  forecast: {
    time: string;
    temp: number;
    icon: string;
    rain_prob: number;
  }[];
  warnings: {
    title: string;
    severity: string;
    description: string;
  }[];
  risk_score: number;
}

export interface HealthStatus {
  status: string;
  database: string;
  ai_provider: string;
}

// ─── Travel Safety Types ──────────────────────────
export interface TravelWeather {
  temperature: number;
  condition: string;
  condition_label: string;
  icon: string;
  rain_probability: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  warnings: { id: string; severity: string; title: string; icon: string }[];
}

export interface TravelRisk {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  icon: string;
}

export interface TravelVerdict {
  status: 'safe' | 'caution' | 'unsafe';
  status_label: string;
  status_color: 'green' | 'yellow' | 'red';
  safety_score: number;
  summary: string;
  risks: TravelRisk[];
  advice: string[];
  safer_alternative_available: boolean;
  recommended_route: string;
}

export interface TravelRouteInfo {
  id: string;
  name: string;
  distance_km: number;
  distance_display: string;
  estimated_minutes: number;
  estimated_time_display: string;
  safety_score: number;
  safety_level: string;
  safety_label: string;
  is_recommended: boolean;
  recommendation: string;
  hazards: { id: string; type: string; label: string; severity: string; description: string; distance_km: number }[];
  blocked_roads: number;
  weather: { condition: string; icon: string; rain_probability: number; temperature: number };
}

export interface TravelSafetyResult {
  origin: { city: string; province: string; lat: number; lng: number };
  destination: { city: string; province: string; lat: number; lng: number };
  distance_km: number;
  travel_time: { minutes: number; display: string; speed_kmh: number };
  mode: string;
  origin_weather: TravelWeather;
  destination_weather: TravelWeather;
  route_safety: {
    primary_route: TravelRouteInfo;
    alternative_route: TravelRouteInfo | null;
    safer_alternative_available: boolean;
    analyzed_at: string;
    disclaimer: string;
  };
  verdict: TravelVerdict;
  checked_at: string;
  disclaimer: string;
}

export interface CitiesResponse {
  total: number;
  by_province: Record<string, { key: string; label: string; lat: number; lng: number }[]>;
}

export interface AnalyticsStats {
  total_emergencies: number;
  people_needing_help: number;
  high_risk_areas: number;
  teams_available: string;
  response_rate: number;
  avg_response_time: string;
  active_alerts: number;
  teams_deployed: string;
  shelters_active: number;
  people_evacuated: number;
}

// ─── API Client ────────────────────────────────────────
class ReliefLinkAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // ─── Health ────────────────────────────────────────
  async health(): Promise<HealthStatus> {
    return this.fetch<HealthStatus>('/health');
  }

  async root(): Promise<{ status: string; service: string; version: string }> {
    return this.fetch('/');
  }

  // ─── SOS Requests ──────────────────────────────────
  async getSOSRequests(): Promise<SOSRequest[]> {
    return this.fetch<SOSRequest[]>('/api/v1/sos');
  }

  async createSOSRequest(data: Partial<SOSRequest>): Promise<SOSRequest> {
    return this.fetch<SOSRequest>('/api/v1/sos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSOSStatus(id: string, status: string): Promise<SOSRequest> {
    return this.fetch<SOSRequest>(`/api/v1/sos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ─── Risk Intelligence ─────────────────────────────
  async getRiskAssessment(): Promise<RiskAssessment> {
    return this.fetch<RiskAssessment>('/api/v1/risk-zones/assessment');
  }

  async getRiskZones(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/risk-zones');
  }

  // ─── Weather Intelligence ──────────────────────────
  async getWeather(lat?: number, lng?: number): Promise<WeatherData> {
    const params = new URLSearchParams();
    if (lat) params.set('lat', lat.toString());
    if (lng) params.set('lng', lng.toString());
    return this.fetch<WeatherData>(`/api/v1/weather?${params}`);
  }

  async getWeatherForecast(lat?: number, lng?: number): Promise<any> {
    const params = new URLSearchParams();
    if (lat) params.set('lat', lat.toString());
    if (lng) params.set('lng', lng.toString());
    return this.fetch(`/api/v1/weather/forecast?${params}`);
  }

  async getRouteSafety(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }): Promise<any> {
    return this.fetch('/api/v1/weather/route-safety', {
      method: 'POST',
      body: JSON.stringify({ origin, destination: dest }),
    });
  }

  // ─── Analytics ─────────────────────────────────────
  async getAnalytics(): Promise<AnalyticsStats> {
    return this.fetch<AnalyticsStats>('/api/v1/analytics');
  }

  async getAnalyticsOverview(): Promise<any> {
    return this.fetch('/api/v1/analytics/overview');
  }

  // ─── Shelters ──────────────────────────────────────
  async getShelters(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/shelters');
  }

  // ─── Hospitals ─────────────────────────────────────
  async getHospitals(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/hospitals');
  }

  // ─── Teams ─────────────────────────────────────────
  async getTeams(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/teams');
  }

  // ─── Volunteers ────────────────────────────────────
  async getVolunteers(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/volunteers');
  }

  // ─── Alerts ────────────────────────────────────────
  async getAlerts(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/alerts');
  }

  async sendAlert(data: any): Promise<any> {
    return this.fetch('/api/v1/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── AI ────────────────────────────────────────────
  async chatWithAI(message: string): Promise<any> {
    return this.fetch('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ─── Safe Routes ───────────────────────────────────
  async getSafeRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<any> {
    return this.fetch('/api/v1/safe-route', {
      method: 'POST',
      body: JSON.stringify({ origin: from, destination: to }),
    });
  }

  // ─── Notifications ─────────────────────────────────
  async getNotifications(): Promise<any[]> {
    return this.fetch<any[]>('/api/v1/notifications');
  }

  // ─── Travel Safety ─────────────────────────────────
  async getTravelSafety(fromCity: string, toCity: string, mode: string = 'car'): Promise<TravelSafetyResult> {
    return this.fetch<TravelSafetyResult>('/api/v1/travel/check', {
      method: 'POST',
      body: JSON.stringify({ from_city: fromCity, to_city: toCity, mode }),
    });
  }

  async getPakistanCities(): Promise<CitiesResponse> {
    return this.fetch<CitiesResponse>('/api/v1/travel/cities');
  }

  // ─── Connection Test ───────────────────────────────
  async isConnected(): Promise<boolean> {
    try {
      const result = await this.root();
      return result.status === 'online';
    } catch {
      return false;
    }
  }
}

// ─── Singleton Export ──────────────────────────────────
export const api = new ReliefLinkAPI(API_BASE);
export default api;
