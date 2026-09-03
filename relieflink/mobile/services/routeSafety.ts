/**
 * ReliefLink — Route Safety Service
 *
 * Analyzes routes between two points for safety:
 *   - Weather conditions along the route
 *   - Disaster/hazard zones that overlap the route
 *   - Blocked roads
 *   - Alternative safer routes when available
 *
 * Uses mock data initially. Production: integrate with Mapbox/OSRM routing.
 */

import { weatherService, type WeatherData } from './weatherService';
import { mockHazardZones, mockBlockedRoads, mockShelters } from '../utils/sampleData';

// ─── Types ──────────────────────────────────────────────────

export type RouteSafetyLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  instruction: string;
}

export interface RouteHazard {
  id: string;
  type: string;
  label: string;
  severity: RouteSafetyLevel;
  description: string;
  distanceKm: number;
}

export interface RouteWeather {
  condition: string;
  icon: string;
  rainProbability: number;
  temperature: number;
  areas: string[]; // Areas along route with notable weather
}

export interface RouteAnalysis {
  id: string;
  name: string;
  distanceKm: number;
  distanceDisplay: string;
  estimatedMinutes: number;
  estimatedTimeDisplay: string;
  safetyScore: number;          // 0-100 (higher = safer)
  safetyLevel: RouteSafetyLevel;
  safetyLabel: string;
  weather: RouteWeather;
  hazards: RouteHazard[];
  blockedRoads: number;
  riskyPoints: number;
  waypoints: RouteWaypoint[];
  isRecommended: boolean;
  recommendation: string;
}

export interface RouteSafetyResult {
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  primaryRoute: RouteAnalysis;
  alternativeRoute: RouteAnalysis | null;
  saferAlternativeAvailable: boolean;
  analyzedAt: string;
  disclaimer: string;
}

// ─── Helpers ────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function midpoint(lat1: number, lng1: number, lat2: number, lng2: number) {
  return { lat: (lat1 + lat2) / 2, lng: (lng1 + lng2) / 2 };
}

function scoreToLevel(score: number): RouteSafetyLevel {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'low';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'high';
  return 'critical';
}

// ─── Mock Route Generator ───────────────────────────────────

function generateMockRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  detourFactor: number = 0,
): { waypoints: RouteWaypoint[]; distanceKm: number; minutes: number } {
  const direct = haversineKm(fromLat, fromLng, toLat, toLng);
  const distance = direct * (1 + detourFactor * 0.3);
  const minutes = Math.round((distance / 30) * 60 + 5); // ~30 km/h in city

  const mid = midpoint(fromLat, fromLng, toLat, toLng);
  // Add slight detour offset
  const offsetLat = detourFactor * 0.008;
  const offsetLng = detourFactor * 0.006;

  const waypoints: RouteWaypoint[] = [
    { lat: fromLat, lng: fromLng, instruction: 'Start — Head towards the main road' },
    {
      lat: mid.lat + offsetLat,
      lng: mid.lng + offsetLng,
      instruction: detourFactor > 0
        ? 'Detour — Taking alternate road to avoid flood zone'
        : 'Continue on main road',
    },
    { lat: toLat, lng: toLng, instruction: 'Arrive at destination' },
  ];

  return { waypoints, distanceKm: distance, minutes };
}

// ─── Route Analysis ─────────────────────────────────────────

async function analyzeRoute(
  id: string,
  name: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  detourFactor: number,
  weather: WeatherData | null,
): Promise<RouteAnalysis> {
  const { waypoints, distanceKm, minutes } = generateMockRoute(
    fromLat, fromLng, toLat, toLng, detourFactor,
  );

  const hazards: RouteHazard[] = [];
  const mid = midpoint(fromLat, fromLng, toLat, toLng);
  let blockedCount = 0;

  // Check hazard zones along route
  for (const hz of mockHazardZones) {
    const distFromStart = haversineKm(fromLat, fromLng, hz.lat, hz.lng);
    const distFromMid = haversineKm(mid.lat, mid.lng, hz.lat, hz.lng);
    const distFromEnd = haversineKm(toLat, toLng, hz.lat, hz.lng);
    const closest = Math.min(distFromStart, distFromMid, distFromEnd);
    const radiusKm = hz.radiusMeters / 1000;

    if (closest <= radiusKm + 1.5) {
      hazards.push({
        id: hz.id,
        type: hz.type,
        label: hz.label,
        severity: hz.severity as RouteSafetyLevel,
        description: hz.description,
        distanceKm: closest,
      });
    }
  }

  // Check blocked roads
  for (const br of mockBlockedRoads) {
    const dist1 = haversineKm(mid.lat, mid.lng, br.fromPoint.lat, br.fromPoint.lng);
    const dist2 = haversineKm(mid.lat, mid.lng, br.toPoint.lat, br.toPoint.lng);
    if (Math.min(dist1, dist2) < 2 + detourFactor) {
      blockedCount++;
    }
  }

  // Weather along route
  const routeWeather: RouteWeather = weather
    ? {
        condition: weather.current.conditionLabel,
        icon: weather.current.icon,
        rainProbability: weather.current.rainProbability,
        temperature: weather.current.temperature,
        areas: hazards.length > 0
          ? hazards.map((h) => h.label)
          : ['No significant weather concerns along route'],
      }
    : {
        condition: 'Unavailable',
        icon: '❓',
        rainProbability: 0,
        temperature: 0,
        areas: ['Weather data not available'],
      };

  // Calculate safety score
  let score = 100;
  // Hazard penalty
  for (const h of hazards) {
    const penalty = h.severity === 'critical' ? 25 : h.severity === 'high' ? 18 : h.severity === 'medium' ? 10 : 5;
    score -= penalty;
  }
  // Blocked roads penalty
  score -= blockedCount * 15;
  // Weather penalty
  if (weather) {
    if (weather.current.condition === 'thunderstorm') score -= 20;
    else if (weather.current.condition === 'heavy_rain') score -= 15;
    else if (weather.current.condition === 'light_rain') score -= 5;
    if (weather.current.rainProbability > 70) score -= 10;
  }
  // Rain areas
  const rainAreas = hazards.filter((h) => h.type === 'flood').length;

  score = Math.max(0, Math.min(100, score));
  const level = scoreToLevel(score);
  const riskyPoints = hazards.filter((h) => h.severity === 'high' || h.severity === 'critical').length;

  const distanceDisplay = distanceKm < 1
    ? `${Math.round(distanceKm * 1000)}m`
    : `${distanceKm.toFixed(1)} km`;
  const estimatedTimeDisplay = minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  let recommendation: string;
  if (level === 'safe' || level === 'low') {
    recommendation = 'This route appears safe. Monitor conditions during travel.';
  } else if (level === 'medium') {
    recommendation = 'Exercise caution. Some risk points detected along this route.';
  } else {
    recommendation = 'This route has significant hazards. Consider an alternative if available.';
  }

  return {
    id,
    name,
    distanceKm,
    distanceDisplay,
    estimatedMinutes: minutes,
    estimatedTimeDisplay,
    safetyScore: score,
    safetyLevel: level,
    safetyLabel: level === 'safe' ? 'Safe' : level === 'low' ? 'Mostly Safe' : level === 'medium' ? 'Moderate Risk' : level === 'high' ? 'Hazardous' : 'Critical',
    weather: routeWeather,
    hazards,
    blockedRoads: blockedCount,
    riskyPoints,
    waypoints,
    isRecommended: false,
    recommendation,
  };
}

// ─── Main Entry Point ───────────────────────────────────────

export async function checkRouteSafety(
  fromLat: number = 33.6844,
  fromLng: number = 73.0479,
  toLat: number = 33.6998,
  toLng: number = 73.0125,
  fromLabel: string = 'Current Location',
  toLabel: string = 'F-11 Community Center',
): Promise<RouteSafetyResult> {
  // Get weather data
  let weather: WeatherData | null = null;
  try {
    weather = await weatherService.getWeather(fromLat, fromLng);
  } catch {
    // Proceed without weather
  }

  // Analyze primary route (direct)
  const primary = await analyzeRoute(
    'route-primary',
    'Direct Route',
    fromLat, fromLng, toLat, toLng,
    0,
    weather,
  );

  // Analyze alternative route (detour)
  const alternative = await analyzeRoute(
    'route-alt',
    'Alternative Route',
    fromLat, fromLng, toLat, toLng,
    1, // detour factor
    weather,
  );

  // Determine which is safer
  const saferAltAvailable = alternative.safetyScore > primary.safetyScore + 5;
  primary.isRecommended = !saferAltAvailable;
  alternative.isRecommended = saferAltAvailable;

  return {
    origin: { lat: fromLat, lng: fromLng, label: fromLabel },
    destination: { lat: toLat, lng: toLng, label: toLabel },
    primaryRoute: primary,
    alternativeRoute: saferAltAvailable ? alternative : null,
    saferAlternativeAvailable: saferAltAvailable,
    analyzedAt: new Date().toISOString(),
    disclaimer:
      'Route safety is an AI-assisted assessment based on available data. Actual road conditions may vary. Always follow local traffic guidance.',
  };
}
