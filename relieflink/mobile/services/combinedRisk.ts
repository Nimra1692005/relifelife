/**
 * ReliefLink — Combined Weather + Disaster Risk Analysis
 *
 * Combines weather intelligence with disaster zone data to produce
 * a unified risk assessment. Does NOT claim to predict disasters —
 * presents an AI-assisted risk assessment based on available data.
 *
 * Architecture:
 *   - Aggregates data from WeatherService, RiskAnalysis, and sampleData
 *   - Produces risk factors, score, and actionable recommendations
 *   - Each factor is weighted and scored transparently
 */

import { weatherService, type WeatherData } from './weatherService';
import { analyzeRisk, type RiskAssessment } from './riskAnalysis';
import {
  mockHazardZones,
  mockBlockedRoads,
  mockLocation,
  mockShelters,
} from '../utils/sampleData';

// ─── Types ──────────────────────────────────────────────────

export type CombinedRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface CombinedRiskFactor {
  id: string;
  type: 'weather' | 'flood' | 'earthquake' | 'road' | 'shelter' | 'wind' | 'terrain';
  label: string;
  severity: CombinedRiskLevel;
  description: string;
  impact: number; // 0-100 — how much this factor affects the overall score
}

export interface CombinedRiskResult {
  overallScore: number;        // 0-100 (higher = more risky)
  level: CombinedRiskLevel;
  label: string;
  description: string;
  factors: CombinedRiskFactor[];
  recommendation: string;
  disclaimer: string;
  analyzedAt: string;
}

// ─── Risk Level Helpers ─────────────────────────────────────

const levelConfig: Record<CombinedRiskLevel, { label: string; color: string }> = {
  safe: { label: 'Safe', color: '#22C55E' },
  low: { label: 'Low Risk', color: '#84CC16' },
  medium: { label: 'Moderate Risk', color: '#F59E0B' },
  high: { label: 'High Risk', color: '#EF4444' },
  critical: { label: 'Critical Risk', color: '#F43F5E' },
};

function scoreToLevel(score: number): CombinedRiskLevel {
  if (score <= 15) return 'safe';
  if (score <= 35) return 'low';
  if (score <= 55) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

// ─── Haversine Distance ─────────────────────────────────────

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

// ─── Main Analysis Function ─────────────────────────────────

export async function analyzeCombinedRisk(
  userLat: number = mockLocation.latitude,
  userLng: number = mockLocation.longitude,
): Promise<CombinedRiskResult> {
  const factors: CombinedRiskFactor[] = [];
  let totalImpact = 0;

  // ─── 1. Weather Risk ─────────────────────────────────────
  let weather: WeatherData | null = null;
  try {
    weather = await weatherService.getWeather(userLat, userLng);
  } catch {
    // Weather unavailable — skip this factor
  }

  if (weather) {
    const rainRisk = weatherService.computeRainRisk(weather);
    factors.push({
      id: 'weather-rain',
      type: 'weather',
      label: 'Rainfall Risk',
      severity: rainRisk > 70 ? 'high' : rainRisk > 40 ? 'medium' : rainRisk > 20 ? 'low' : 'safe',
      description:
        weather.current.rainProbability >= 70
          ? `Heavy rainfall (${weather.current.rainProbability}%) with ${weather.current.conditionLabel.toLowerCase()}`
          : `Rain probability ${weather.current.rainProbability}% — ${weather.current.conditionLabel}`,
      impact: rainRisk,
    });
    totalImpact += rainRisk * 0.25;

    // Wind risk
    if (weather.current.windSpeed > 30) {
      const windRisk = Math.min(100, (weather.current.windSpeed / 80) * 100);
      factors.push({
        id: 'weather-wind',
        type: 'wind',
        label: 'Wind Conditions',
        severity: windRisk > 60 ? 'high' : windRisk > 30 ? 'medium' : 'low',
        description: `Wind speed ${weather.current.windSpeed} km/h from ${weather.current.windDirection}`,
        impact: Math.round(windRisk),
      });
      totalImpact += windRisk * 0.1;
    }

    // Thunderstorm risk
    if (weather.current.condition === 'thunderstorm') {
      factors.push({
        id: 'weather-thunderstorm',
        type: 'weather',
        label: 'Thunderstorm',
        severity: 'high',
        description: 'Active thunderstorm — risk of lightning strikes',
        impact: 75,
      });
      totalImpact += 75 * 0.15;
    }
  }

  // ─── 2. Disaster Zone Proximity ──────────────────────────
  const nearbyHazards = mockHazardZones
    .map((hz) => {
      const dist = haversineKm(userLat, userLng, hz.lat, hz.lng);
      return { ...hz, distanceKm: dist };
    })
    .filter((hz) => hz.distanceKm < 5)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  for (const hazard of nearbyHazards.slice(0, 3)) {
    const proximityImpact = Math.max(10, Math.round(100 - hazard.distanceKm * 20));
    const severityMultiplier =
      hazard.severity === 'critical' ? 1.0 :
      hazard.severity === 'high' ? 0.8 :
      hazard.severity === 'medium' ? 0.5 : 0.3;

    const impact = Math.round(proximityImpact * severityMultiplier);

    const typeMap: Record<string, CombinedRiskFactor['type']> = {
      flood: 'flood',
      landslide: 'terrain',
      blocked_road: 'road',
      fire: 'weather',
      collapse: 'terrain',
    };

    factors.push({
      id: `hazard-${hazard.id}`,
      type: typeMap[hazard.type] || 'weather',
      label: hazard.label,
      severity: hazard.severity as CombinedRiskLevel,
      description: `${hazard.description} (${hazard.distanceKm.toFixed(1)} km away)`,
      impact,
    });
    totalImpact += impact * 0.15;
  }

  // ─── 3. Blocked Roads ────────────────────────────────────
  const nearbyBlocked = mockBlockedRoads.filter((br) => {
    const dist1 = haversineKm(userLat, userLng, br.fromPoint.lat, br.fromPoint.lng);
    const dist2 = haversineKm(userLat, userLng, br.toPoint.lat, br.toPoint.lng);
    return Math.min(dist1, dist2) < 5;
  });

  if (nearbyBlocked.length > 0) {
    factors.push({
      id: 'roads-blocked',
      type: 'road',
      label: 'Blocked Roads',
      severity: nearbyBlocked.length >= 3 ? 'high' : nearbyBlocked.length >= 1 ? 'medium' : 'low',
      description: `${nearbyBlocked.length} road${nearbyBlocked.length > 1 ? 's' : ''} blocked nearby: ${nearbyBlocked.map((r) => r.name).join(', ')}`,
      impact: nearbyBlocked.length * 25,
    });
    totalImpact += nearbyBlocked.length * 15;
  }

  // ─── 4. Shelter Accessibility ────────────────────────────
  const nearestShelter = mockShelters
    .map((s) => ({
      ...s,
      dist: haversineKm(userLat, userLng, s.lat, s.lng),
    }))
    .sort((a, b) => a.dist - b.dist)[0];

  if (nearestShelter && nearestShelter.dist > 3) {
    factors.push({
      id: 'shelter-distance',
      type: 'shelter',
      label: 'Shelter Accessibility',
      severity: nearestShelter.dist > 8 ? 'high' : nearestShelter.dist > 5 ? 'medium' : 'low',
      description: `Nearest shelter is ${nearestShelter.dist.toFixed(1)} km away (${nearestShelter.name})`,
      impact: Math.round(nearestShelter.dist * 5),
    });
    totalImpact += nearestShelter.dist * 2;
  }

  // ─── Compute Overall Score ───────────────────────────────
  const overallScore = Math.min(100, Math.round(totalImpact));
  const level = scoreToLevel(overallScore);
  const { label } = levelConfig[level];

  // ─── Description ─────────────────────────────────────────
  const topFactors = factors
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);
  const description =
    topFactors.length > 0
      ? `Key risks: ${topFactors.map((f) => f.label).join(', ')}.`
      : 'No significant risks detected in your area.';

  // ─── Recommendation ──────────────────────────────────────
  let recommendation: string;
  if (level === 'critical') {
    recommendation = 'Immediate danger detected. Evacuate to the nearest safe shelter now.';
  } else if (level === 'high') {
    recommendation = nearestShelter
      ? `Move toward the nearest available safe shelter: ${nearestShelter.name} (${nearestShelter.dist.toFixed(1)} km).`
      : 'Move to a safe area away from flood zones and blocked roads.';
  } else if (level === 'medium') {
    recommendation = 'Stay alert. Prepare emergency supplies and monitor weather updates. Keep your phone charged.';
  } else {
    recommendation = 'Conditions are relatively safe. Stay informed and keep emergency contacts accessible.';
  }

  // ─── Disclaimer ──────────────────────────────────────────
  const disclaimer =
    'This is an AI-assisted risk assessment based on available data. It is not a prediction of future events. Always follow official guidance from local authorities.';

  return {
    overallScore,
    level,
    label,
    description,
    factors,
    recommendation,
    disclaimer,
    analyzedAt: new Date().toISOString(),
  };
}

export { levelConfig as combinedRiskLevelConfig };
