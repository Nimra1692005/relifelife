/**
 * ReliefLink — AI Risk Analysis & Safe Navigation Engine
 *
 * Analyzes user location against disaster data to produce:
 * 1. Overall risk level (SAFE → CRITICAL)
 * 2. Ranked safe destinations with safety scores
 * 3. Safe routes that avoid hazard zones
 *
 * Architecture: Currently uses mock data. Replace data sources
 * with live API/WebSocket feeds for production.
 */

import {
  mockAlerts,
  mockHazardZones,
  mockBlockedRoads,
  mockShelters,
  mockHospitals,
  mockLocation,
  type MockHazardZone,
} from '../utils/sampleData';

// ─── Types ──────────────────────────────────────────────

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  type: string;
  label: string;
  level: RiskLevel;
  weight: number; // 0-1
  score: number; // 0-100
  description: string;
}

export interface RiskAssessment {
  overallScore: number; // 0-100 (higher = safer)
  level: RiskLevel;
  label: string;
  description: string;
  factors: RiskFactor[];
  nearbyHazards: HazardProximity[];
  lastUpdated: string;
  recommendation: string;
}

export interface HazardProximity {
  id: string;
  type: MockHazardZone['type'];
  label: string;
  severity: RiskLevel;
  distanceKm: number;
  radiusMeters: number;
  riskContribution: number; // 0-100 how much this hazard affects user
  description: string;
}

export interface SafeDestination {
  id: string;
  name: string;
  type: 'shelter' | 'hospital' | 'rescue_center' | 'safe_zone';
  icon: string;
  address: string;
  distanceKm: number;
  travelTimeMin: number;
  walkingTimeMin: number;
  capacity: number;
  currentOccupancy: number;
  availableSpots: number;
  safetyScore: number; // 0-100
  safetyLevel: RiskLevel;
  routeRiskZones: number; // count of risk zones on route
  facilities: string[];
  lat: number;
  lng: number;
}

export interface RouteWarning {
  id: string;
  type: 'hazard' | 'blocked_road' | 'detour';
  title: string;
  description: string;
  severity: RiskLevel;
  lat: number;
  lng: number;
}

export interface SafeRoute {
  id: string;
  destinationId: string;
  destinationName: string;
  viaRoute: string;
  distanceKm: number;
  driveTimeMin: number;
  walkingTimeMin: number;
  safetyScore: number;
  riskZonesCrossed: number;
  warnings: RouteWarning[];
  waypoints: RouteWaypoint[];
  alternativeRoutes: AlternativeRoute[];
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  label: string;
  type: 'start' | 'turn' | 'checkpoint' | 'destination';
}

export interface AlternativeRoute {
  viaRoute: string;
  distanceKm: number;
  driveTimeMin: number;
  safetyScore: number;
  riskZonesCrossed: number;
  recommended: boolean;
}

// ─── Utility: Haversine Distance ────────────────────────

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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

// ─── Risk Level Mapping ─────────────────────────────────

function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return 'safe';
  if (score >= 65) return 'low';
  if (score >= 45) return 'medium';
  if (score >= 25) return 'high';
  return 'critical';
}

function levelToConfig(level: RiskLevel) {
  const configs: Record<
    RiskLevel,
    { color: string; label: string; glow: string; bg: string }
  > = {
    safe: {
      color: '#4ADE80',
      label: 'Safe',
      glow: '#22C55E',
      bg: 'rgba(34,197,94,0.08)',
    },
    low: {
      color: '#A3E635',
      label: 'Low Risk',
      glow: '#84CC16',
      bg: 'rgba(132,204,22,0.08)',
    },
    medium: {
      color: '#FBBF24',
      label: 'Moderate Risk',
      glow: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
    },
    high: {
      color: '#F87171',
      label: 'High Risk',
      glow: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
    },
    critical: {
      color: '#FB7185',
      label: 'Critical',
      glow: '#F43F5E',
      bg: 'rgba(244,63,94,0.08)',
    },
  };
  return configs[level];
}

export { levelToConfig };

// ─── 1. RISK ANALYSIS ───────────────────────────────────

/**
 * Analyze the user's current risk based on location,
 * nearby hazards, active alerts, and distance to safe zones.
 */
export function analyzeRisk(
  userLat = mockLocation.latitude,
  userLng = mockLocation.longitude
): RiskAssessment {
  const factors: RiskFactor[] = [];

  // ── Factor 1: Hazard proximity ─────────────────────
  const nearbyHazards: HazardProximity[] = mockHazardZones.map((hz) => {
    const dist = haversineKm(userLat, userLng, hz.lat, hz.lng);
    const withinRadius = dist * 1000 < hz.radiusMeters * 3;
    const severityWeight: Record<string, number> = {
      low: 0.25,
      medium: 0.5,
      high: 0.8,
      critical: 1.0,
    };
    const proximityFactor = Math.max(0, 1 - dist / 5); // within 5km matters
    const contribution = Math.round(
      severityWeight[hz.severity] * proximityFactor * 100
    );

    return {
      id: hz.id,
      type: hz.type,
      label: hz.label,
      severity: hz.severity as RiskLevel,
      distanceKm: Math.round(dist * 100) / 100,
      radiusMeters: hz.radiusMeters,
      riskContribution: Math.min(contribution, 100),
      description: hz.description,
    };
  });

  nearbyHazards.sort((a, b) => a.distanceKm - b.distanceKm);

  const closestHazard = nearbyHazards[0];
  const hazardScore = closestHazard
    ? Math.max(0, 100 - closestHazard.riskContribution)
    : 100;

  factors.push({
    type: 'hazard_proximity',
    label: 'Hazard Proximity',
    level: scoreToLevel(hazardScore),
    weight: 0.3,
    score: hazardScore,
    description: closestHazard
      ? `${closestHazard.label} is ${closestHazard.distanceKm} km away`
      : 'No hazards nearby',
  });

  // ── Factor 2: Active alerts severity ───────────────
  const activeAlerts = mockAlerts.filter(
    (a) => a.distance === '0 km' || parseFloat(a.distance) < 8
  );
  const alertSeverityScore =
    activeAlerts.length === 0
      ? 100
      : Math.max(
          0,
          100 -
            activeAlerts.reduce((acc, a) => {
              const sevPoints: Record<string, number> = {
                low: 5,
                medium: 15,
                high: 30,
                critical: 45,
              };
              return acc + (sevPoints[a.severity] || 10);
            }, 0)
        );

  factors.push({
    type: 'active_alerts',
    label: 'Active Alerts',
    level: scoreToLevel(alertSeverityScore),
    weight: 0.25,
    score: alertSeverityScore,
    description: `${activeAlerts.length} active alert${activeAlerts.length !== 1 ? 's' : ''} in your area`,
  });

  // ── Factor 3: Distance to safe zones ───────────────
  const nearestShelterDist = Math.min(
    ...mockShelters.map((s) => haversineKm(userLat, userLng, s.lat, s.lng))
  );
  const safeZoneScore = Math.min(100, Math.round(100 - nearestShelterDist * 15));

  factors.push({
    type: 'safe_zone_distance',
    label: 'Safe Zone Access',
    level: scoreToLevel(safeZoneScore),
    weight: 0.2,
    score: safeZoneScore,
    description: `Nearest shelter ${nearestShelterDist.toFixed(1)} km away`,
  });

  // ── Factor 4: Blocked roads nearby ─────────────────
  const nearbyBlocked = mockBlockedRoads.filter((br) => {
    const d1 = haversineKm(userLat, userLng, br.fromPoint.lat, br.fromPoint.lng);
    const d2 = haversineKm(userLat, userLng, br.toPoint.lat, br.toPoint.lng);
    return Math.min(d1, d2) < 3;
  });
  const roadScore = Math.max(0, 100 - nearbyBlocked.length * 25);

  factors.push({
    type: 'road_access',
    label: 'Road Accessibility',
    level: scoreToLevel(roadScore),
    weight: 0.15,
    score: roadScore,
    description:
      nearbyBlocked.length === 0
        ? 'All major roads accessible'
        : `${nearbyBlocked.length} blocked road${nearbyBlocked.length !== 1 ? 's' : ''} nearby`,
  });

  // ── Factor 5: Flooded areas ────────────────────────
  const floodZones = nearbyHazards.filter((h) => h.type === 'flood');
  const nearestFlood = floodZones[0];
  const floodScore = nearestFlood
    ? Math.max(0, Math.min(100, Math.round(nearestFlood.distanceKm * 25)))
    : 100;

  factors.push({
    type: 'flood_risk',
    label: 'Flood Risk',
    level: scoreToLevel(floodScore),
    weight: 0.1,
    score: floodScore,
    description: nearestFlood
      ? `Flood zone ${nearestFlood.distanceKm} km away`
      : 'No flood risk detected',
  });

  // ── Calculate weighted overall score ───────────────
  const overallScore = Math.round(
    factors.reduce((acc, f) => acc + f.score * f.weight, 0)
  );
  const clampedScore = Math.max(0, Math.min(100, overallScore));
  const level = scoreToLevel(clampedScore);

  const recommendations: Record<RiskLevel, string> = {
    safe: 'Your area is currently safe. Stay informed with live alerts.',
    low: 'Low risk detected. Monitor alerts and know your nearest shelter.',
    medium:
      'Moderate risk in your area. Consider moving to a safer location if conditions worsen.',
    high: 'High risk detected. Move to the nearest shelter or safe zone immediately.',
    critical:
      'Critical danger. Evacuate immediately to the nearest safe destination.',
  };

  return {
    overallScore: clampedScore,
    level,
    label: levelToConfig(level).label,
    description:
      level === 'medium'
        ? 'Moderate flood risk in your area due to recent heavy rainfall in upstream regions. Stay alert and monitor alerts.'
        : recommendations[level],
    factors,
    nearbyHazards: nearbyHazards.slice(0, 5),
    lastUpdated: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    recommendation: recommendations[level],
  };
}

// ─── 2. SAFE DESTINATION RANKING ────────────────────────

/**
 * Rank all nearby destinations by safety score.
 * Considers: distance from hazards, capacity, distance from user, road access.
 */
export function findSafeDestinations(
  userLat = mockLocation.latitude,
  userLng = mockLocation.longitude
): SafeDestination[] {
  const destinations: SafeDestination[] = [];

  // Process shelters
  mockShelters.forEach((s) => {
    const distKm = haversineKm(userLat, userLng, s.lat, s.lng);
    const safetyScore = calculateDestinationSafety(
      s.lat,
      s.lng,
      distKm,
      s.capacity - s.currentOccupancy
    );

    const typeIcons: Record<string, string> = {
      shelter: '🏠',
      hospital: '🏥',
      relief_camp: '⛺',
      mosque: '🕌',
      school: '🏫',
    };

    destinations.push({
      id: s.id,
      name: s.name,
      type: s.type === 'relief_camp' ? 'shelter' : (s.type as SafeDestination['type']),
      icon: typeIcons[s.type] || '🏠',
      address: s.address,
      distanceKm: Math.round(distKm * 100) / 100,
      travelTimeMin: Math.round(distKm * 4 + 1),
      walkingTimeMin: Math.round(distKm * 12 + 2),
      capacity: s.capacity,
      currentOccupancy: s.currentOccupancy,
      availableSpots: s.capacity - s.currentOccupancy,
      safetyScore,
      safetyLevel: scoreToLevel(safetyScore),
      routeRiskZones: countRouteRiskZones(userLat, userLng, s.lat, s.lng),
      facilities: s.facilities,
      lat: s.lat,
      lng: s.lng,
    });
  });

  // Process hospitals
  mockHospitals.forEach((h) => {
    const distKm = haversineKm(userLat, userLng, h.lat, h.lng);
    const safetyScore = calculateDestinationSafety(
      h.lat,
      h.lng,
      distKm,
      999 // hospitals always have capacity
    );

    destinations.push({
      id: h.id,
      name: h.name,
      type: 'hospital',
      icon: '🏥',
      address: h.address,
      distanceKm: Math.round(distKm * 100) / 100,
      travelTimeMin: Math.round(distKm * 4 + 1),
      walkingTimeMin: Math.round(distKm * 12 + 2),
      capacity: 0,
      currentOccupancy: 0,
      availableSpots: -1, // N/A for hospitals
      safetyScore,
      safetyLevel: scoreToLevel(safetyScore),
      routeRiskZones: countRouteRiskZones(userLat, userLng, h.lat, h.lng),
      facilities: ['Emergency', 'ICU', 'Surgery', 'Pharmacy'],
      lat: h.lat,
      lng: h.lng,
    });
  });

  // Sort by safety score descending
  destinations.sort((a, b) => b.safetyScore - a.safetyScore);

  return destinations;
}

function calculateDestinationSafety(
  destLat: number,
  destLng: number,
  distanceKm: number,
  availableSpots: number
): number {
  // 1. Distance from all hazard zones (bigger = safer)
  let hazardPenalty = 0;
  mockHazardZones.forEach((hz) => {
    const distToHazard = haversineKm(destLat, destLng, hz.lat, hz.lng);
    const sevWeights: Record<string, number> = {
      low: 5,
      medium: 12,
      high: 22,
      critical: 35,
    };
    if (distToHazard < 2) {
      hazardPenalty += (sevWeights[hz.severity] || 10) * (1 - distToHazard / 2);
    }
  });

  // 2. Distance penalty (closer = better, but not too close to danger)
  const distanceScore = Math.max(0, 30 - distanceKm * 5);

  // 3. Capacity bonus (more spots = safer)
  const capacityBonus =
    availableSpots < 0
      ? 20
      : Math.min(20, availableSpots / 20);

  // Combine: start at 100, subtract penalties, add bonuses
  const raw = 100 - hazardPenalty + distanceScore * 0.1 + capacityBonus - distanceKm * 3;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function countRouteRiskZones(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  // Simplified: count hazard zones whose center is within 1km of the
  // straight line between from and to
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;
  let count = 0;

  mockHazardZones.forEach((hz) => {
    const distToMid = haversineKm(midLat, midLng, hz.lat, hz.lng);
    const routeLength = haversineKm(fromLat, fromLng, toLat, toLng);
    if (distToMid < Math.max(routeLength * 0.6, 1)) {
      count++;
    }
  });

  return count;
}

// ─── 3. SAFE ROUTE CALCULATION ──────────────────────────

/**
 * Calculate the safest route from user to destination.
 * Avoids hazard zones and blocked roads.
 */
export function calculateSafeRoute(
  destId: string,
  userLat = mockLocation.latitude,
  userLng = mockLocation.longitude
): SafeRoute | null {
  const dest = findSafeDestinations(userLat, userLng).find(
    (d) => d.id === destId
  );
  if (!dest) return null;

  // ── Identify hazards near the direct route ─────────
  const warnings: RouteWarning[] = [];
  const midLat = (userLat + dest.lat) / 2;
  const midLng = (userLng + dest.lng) / 2;
  const directDist = haversineKm(userLat, userLng, dest.lat, dest.lng);

  mockHazardZones.forEach((hz) => {
    const distToRoute = haversineKm(midLat, midLng, hz.lat, hz.lng);
    if (distToRoute < directDist * 0.8) {
      warnings.push({
        id: `w_${hz.id}`,
        type: 'hazard',
        title: `Avoid: ${hz.label}`,
        description: hz.description,
        severity: hz.severity as RiskLevel,
        lat: hz.lat,
        lng: hz.lng,
      });
    }
  });

  mockBlockedRoads.forEach((br) => {
    const distFrom = haversineKm(
      midLat,
      midLng,
      br.fromPoint.lat,
      br.fromPoint.lng
    );
    if (distFrom < directDist) {
      warnings.push({
        id: `w_${br.id}`,
        type: 'blocked_road',
        title: `Blocked: ${br.name}`,
        description: br.reason,
        severity: 'high',
        lat: (br.fromPoint.lat + br.toPoint.lat) / 2,
        lng: (br.fromPoint.lng + br.toPoint.lng) / 2,
      });
    }
  });

  // ── Generate simulated waypoints ───────────────────
  const waypoints: RouteWaypoint[] = [
    { lat: userLat, lng: userLng, label: 'Your Location', type: 'start' },
  ];

  // Simulate route that avoids hazards (offset from direct line)
  const hasHazardsNearby = warnings.length > 0;
  if (hasHazardsNearby) {
    // Add a detour waypoint
    const detourLat = userLat + (dest.lat - userLat) * 0.4 + 0.005;
    const detourLng = userLng + (dest.lng - userLng) * 0.4 - 0.008;
    waypoints.push({
      lat: detourLat,
      lng: detourLng,
      label: 'Via safe corridor',
      type: 'turn',
    });
  }

  // Mid-point checkpoint
  const cpLat = userLat + (dest.lat - userLat) * 0.65;
  const cpLng = userLng + (dest.lng - userLng) * 0.65;
  waypoints.push({
    lat: cpLat,
    lng: cpLng,
    label: 'Route checkpoint',
    type: 'checkpoint',
  });

  waypoints.push({
    lat: dest.lat,
    lng: dest.lng,
    label: dest.name,
    type: 'destination',
  });

  // ── Route names ────────────────────────────────────
  const safeViaRoutes = [
    'Jinnah Avenue → F-11 Markaz',
    '9th Avenue → Margalla Road',
    'IJP Road → G-11 Link',
    'Constitution Avenue → Blue Area',
  ];
  const selectedVia =
    safeViaRoutes[Math.floor(Math.random() * safeViaRoutes.length)];

  // ── Alternative routes ─────────────────────────────
  const altRoutes: AlternativeRoute[] = [];
  const safeRouteZones = warnings.filter((w) => w.type === 'hazard').length;

  // Alt route 1 (shorter but riskier)
  altRoutes.push({
    viaRoute: 'Direct route via Margalla Road',
    distanceKm: Math.round((directDist * 0.85) * 100) / 100,
    driveTimeMin: Math.round(directDist * 3.5),
    safetyScore: Math.max(0, dest.safetyScore - 20),
    riskZonesCrossed: safeRouteZones + 2,
    recommended: false,
  });

  // Alt route 2 (longer, equally safe)
  altRoutes.push({
    viaRoute: 'Via IJP Road → Service Road',
    distanceKm: Math.round((directDist * 1.3) * 100) / 100,
    driveTimeMin: Math.round(directDist * 5.5),
    safetyScore: Math.max(0, dest.safetyScore - 5),
    riskZonesCrossed: safeRouteZones,
    recommended: false,
  });

  // ── Detour distance if avoiding hazards ─────────────
  const finalDist = hasHazardsNearby
    ? Math.round(directDist * 1.15 * 100) / 100
    : Math.round(directDist * 1.0 * 100) / 100;

  return {
    id: `route_${dest.id}`,
    destinationId: dest.id,
    destinationName: dest.name,
    viaRoute: selectedVia,
    distanceKm: finalDist,
    driveTimeMin: Math.round(finalDist * 4 + 1),
    walkingTimeMin: Math.round(finalDist * 12 + 2),
    safetyScore: dest.safetyScore,
    riskZonesCrossed: safeRouteZones,
    warnings,
    waypoints,
    alternativeRoutes: altRoutes,
  };
}

// ─── Convenience: Get best recommendation ───────────────

export function getBestRecommendation(
  userLat = mockLocation.latitude,
  userLng = mockLocation.longitude
): {
  risk: RiskAssessment;
  bestDestination: SafeDestination | null;
  route: SafeRoute | null;
  allDestinations: SafeDestination[];
} {
  const risk = analyzeRisk(userLat, userLng);
  const destinations = findSafeDestinations(userLat, userLng);
  const best = destinations[0] || null;
  const route = best ? calculateSafeRoute(best.id, userLat, userLng) : null;

  return {
    risk,
    bestDestination: best,
    route,
    allDestinations: destinations,
  };
}
