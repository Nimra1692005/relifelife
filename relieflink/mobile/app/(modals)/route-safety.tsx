/**
 * ReliefLink — Route Safety Screen (Modal)
 *
 * Full route safety analysis:
 *   - Select destination
 *   - Analyze primary & alternative routes
 *   - Weather, hazards, blocked roads along route
 *   - Safety scores with severity-coded visuals
 *   - Alternative route recommendation when safer
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius } from '../../constants/theme';
import {
  checkRouteSafety,
  type RouteSafetyResult,
  type RouteAnalysis,
} from '../../services/routeSafety';

// ─── Severity Config ────────────────────────────────────────

const severityStyle: Record<string, { bg: string; text: string; border: string; solid: string }> = {
  safe:     { bg: 'rgba(34,197,94,0.06)', text: '#4ADE80', border: 'rgba(34,197,94,0.20)', solid: '#22C55E' },
  low:      { bg: 'rgba(132,204,22,0.06)', text: '#A3E635', border: 'rgba(132,204,22,0.20)', solid: '#84CC16' },
  medium:   { bg: 'rgba(245,158,11,0.06)', text: '#FBBF24', border: 'rgba(245,158,11,0.20)', solid: '#F59E0B' },
  high:     { bg: 'rgba(239,68,68,0.06)', text: '#F87171', border: 'rgba(239,68,68,0.20)', solid: '#EF4444' },
  critical: { bg: 'rgba(244,63,94,0.06)', text: '#FB7185', border: 'rgba(244,63,94,0.20)', solid: '#F43F5E' },
};

function getSev(key: string) {
  return severityStyle[key] || severityStyle.medium;
}

// ─── Mock Destinations ──────────────────────────────────────

const mockDestinations = [
  { label: 'F-11 Community Center', lat: 33.6998, lng: 73.0125, icon: '🏢' },
  { label: 'PIMS Hospital', lat: 33.7100, lng: 73.0300, icon: '🏥' },
  { label: 'Centaurus Mall', lat: 33.6905, lng: 73.0470, icon: '🏬' },
  { label: 'G-11 Markaz', lat: 33.6800, lng: 73.0350, icon: '🏪' },
];

// ─── Main Screen ────────────────────────────────────────────

export const RouteSafetyScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteSafetyResult | null>(null);
  const [selectedDest, setSelectedDest] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const dest = mockDestinations[selectedDest];
      const res = await checkRouteSafety(
        33.6844, 73.0479,
        dest.lat, dest.lng,
        'Current Location (G-11)',
        dest.label,
      );
      setResult(res);
      setAnalyzed(true);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Route Safety</Text>
          <Text style={styles.subtitle}>
            Analyze weather, hazards & road conditions along your route
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Route Setup ──────────────────────────────────── */}
        <View style={styles.setupCard}>
          {/* Origin */}
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
            <View style={styles.routePointInfo}>
              <Text style={styles.routePointLabel}>FROM</Text>
              <Text style={styles.routePointValue}>Current Location — G-11, Islamabad</Text>
            </View>
          </View>

          {/* Connector line */}
          <View style={styles.connector}>
            <View style={styles.connectorLine} />
          </View>

          {/* Destination selector */}
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            <View style={styles.routePointInfo}>
              <Text style={styles.routePointLabel}>TO</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {mockDestinations.map((dest, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { setSelectedDest(i); setAnalyzed(false); }}
                    style={[
                      styles.destPill,
                      selectedDest === i && styles.destPillActive,
                    ]}
                  >
                    <Text style={styles.destIcon}>{dest.icon}</Text>
                    <Text
                      style={[
                        styles.destText,
                        selectedDest === i && styles.destTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {dest.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* ── Analyze Button ───────────────────────────────── */}
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.analyzeBtnIcon}>🛡️</Text>
              <Text style={styles.analyzeBtnText}>
                {analyzed ? 'Re-analyze Route' : 'Check Route Safety'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Results ──────────────────────────────────────── */}
        {result && (
          <>
            {/* Primary Route */}
            <SectionHeader title="Primary Route" subtitle={result.primaryRoute.name} />
            <RouteCard route={result.primaryRoute} />

            {/* Alternative Route */}
            {result.alternativeRoute && (
              <>
                <View style={styles.altBanner}>
                  <Text style={styles.altBannerIcon}>🛡️</Text>
                  <Text style={styles.altBannerText}>Safer alternative route available</Text>
                </View>
                <SectionHeader title="Alternative Route" subtitle={result.alternativeRoute.name} />
                <RouteCard route={result.alternativeRoute} />
              </>
            )}

            {/* Route Comparison */}
            {result.alternativeRoute && (
              <RouteComparison
                primary={result.primaryRoute}
                alternative={result.alternativeRoute}
              />
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerIcon}>ℹ️</Text>
              <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
            </View>
          </>
        )}

        {/* ── Empty State ──────────────────────────────────── */}
        {!result && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Select a Destination</Text>
            <Text style={styles.emptySub}>
              Choose your destination above and tap "Check Route Safety" to analyze weather, hazards, and road conditions.
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Route Card Component ───────────────────────────────────

const RouteCard: React.FC<{ route: RouteAnalysis }> = ({ route }) => {
  const sev = getSev(route.safetyLevel);

  return (
    <View style={[rcStyles.card, { borderColor: sev.border, borderLeftWidth: 3, borderLeftColor: sev.solid }]}>
      {/* Top: Score + Label */}
      <View style={rcStyles.top}>
        <View style={[rcStyles.scoreWrap, { borderColor: sev.solid }]}>
          <Text style={[rcStyles.scoreNum, { color: sev.text }]}>{route.safetyScore}</Text>
          <Text style={rcStyles.scoreLbl}>SCORE</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[rcStyles.levelPill, { backgroundColor: sev.bg }]}>
            <View style={[rcStyles.levelDot, { backgroundColor: sev.solid }]} />
            <Text style={[rcStyles.levelText, { color: sev.text }]}>
              {route.safetyLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={rcStyles.recText} numberOfLines={2}>{route.recommendation}</Text>
        </View>
        {route.isRecommended && (
          <View style={rcStyles.recommendedBadge}>
            <Text style={rcStyles.recommendedText}>RECOMMENDED</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={rcStyles.statsRow}>
        <RouteStat icon="📏" label="Distance" value={route.distanceDisplay} />
        <RouteStat icon="⏱️" label="Est. Time" value={route.estimatedTimeDisplay} />
        <RouteStat icon="🌧️" label="Rain" value={`${route.weather.rainProbability}%`} />
        <RouteStat icon="⚠️" label="Risks" value={`${route.riskyPoints}`} />
      </View>

      {/* Weather Along Route */}
      <View style={rcStyles.weatherSection}>
        <Text style={rcStyles.weatherTitle}>Weather Along Route</Text>
        <View style={rcStyles.weatherRow}>
          <Text style={rcStyles.weatherIcon}>{route.weather.icon}</Text>
          <Text style={rcStyles.weatherCondition}>{route.weather.condition}</Text>
          <Text style={rcStyles.weatherTemp}>{route.weather.temperature}°C</Text>
        </View>
        {route.weather.areas.map((area, i) => (
          <View key={i} style={rcStyles.areaRow}>
            <View style={[rcStyles.areaDot, { backgroundColor: i === 0 ? sev.solid : 'rgba(148,163,184,0.3)' }]} />
            <Text style={rcStyles.areaText}>{area}</Text>
          </View>
        ))}
      </View>

      {/* Hazards */}
      {route.hazards.length > 0 && (
        <View style={rcStyles.hazardSection}>
          <Text style={rcStyles.hazardTitle}>Hazards ({route.hazards.length})</Text>
          {route.hazards.map((h, i) => {
            const hSev = getSev(h.severity);
            return (
              <View key={h.id} style={rcStyles.hazardRow}>
                <View style={[rcStyles.hazardDot, { backgroundColor: hSev.solid }]} />
                <View style={{ flex: 1 }}>
                  <Text style={rcStyles.hazardLabel}>{h.label}</Text>
                  <Text style={rcStyles.hazardDist}>{h.distanceKm.toFixed(1)} km away</Text>
                </View>
                <View style={[rcStyles.hazardBadge, { borderColor: hSev.border }]}>
                  <Text style={[rcStyles.hazardBadgeText, { color: hSev.text }]}>
                    {h.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Blocked Roads */}
      {route.blockedRoads > 0 && (
        <View style={rcStyles.blockedRow}>
          <Text style={rcStyles.blockedIcon}>🚧</Text>
          <Text style={rcStyles.blockedText}>
            {route.blockedRoads} blocked road{route.blockedRoads > 1 ? 's' : ''} on this route
          </Text>
        </View>
      )}
    </View>
  );
};

const rcStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.bg.card,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  scoreWrap: {
    width: 62, height: 62, borderRadius: 31,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)', marginRight: 14,
  },
  scoreNum: { fontSize: 24, fontWeight: '800', fontFamily: 'SpaceGrotesk-Bold' },
  scoreLbl: { fontSize: 9, color: colors.text.tertiary, fontWeight: '600', marginTop: -2 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 6,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  recText: { fontSize: 11, color: colors.text.secondary, lineHeight: 16 },
  recommendedBadge: {
    backgroundColor: 'rgba(34,197,94,0.10)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.20)',
  },
  recommendedText: { fontSize: 8, fontWeight: '800', color: '#4ADE80', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  weatherSection: {
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border.subtle,
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 11, fontWeight: '700', color: colors.text.tertiary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  weatherIcon: { fontSize: 18 },
  weatherCondition: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  weatherTemp: { fontSize: 13, color: colors.text.secondary },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  areaDot: { width: 6, height: 6, borderRadius: 3 },
  areaText: { fontSize: 11, color: colors.text.secondary, flex: 1 },
  hazardSection: {
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border.subtle,
    marginBottom: 12,
  },
  hazardTitle: {
    fontSize: 11, fontWeight: '700', color: colors.text.tertiary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  hazardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  hazardDot: { width: 8, height: 8, borderRadius: 4 },
  hazardLabel: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  hazardDist: { fontSize: 10, color: colors.text.tertiary },
  hazardBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1,
  },
  hazardBadgeText: { fontSize: 9, fontWeight: '700' },
  blockedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
  },
  blockedIcon: { fontSize: 16 },
  blockedText: { fontSize: 12, color: '#F87171', fontWeight: '600' },
});

// ─── Route Stat Component ───────────────────────────────────

const RouteStat: React.FC<{ icon: string; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <View style={rsStyles.stat}>
    <Text style={rsStyles.icon}>{icon}</Text>
    <Text style={rsStyles.value}>{value}</Text>
    <Text style={rsStyles.label}>{label}</Text>
  </View>
);

const rsStyles = StyleSheet.create({
  stat: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  icon: { fontSize: 14, marginBottom: 3 },
  value: { fontSize: 13, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  label: { fontSize: 9, color: colors.text.tertiary, fontWeight: '500' },
});

// ─── Route Comparison ───────────────────────────────────────

const RouteComparison: React.FC<{
  primary: RouteAnalysis;
  alternative: RouteAnalysis;
}> = ({ primary, alternative }) => {
  const pSev = getSev(primary.safetyLevel);
  const aSev = getSev(alternative.safetyLevel);
  const safer = alternative.safetyScore > primary.safetyScore;

  return (
    <View style={cmpStyles.card}>
      <Text style={cmpStyles.title}>Route Comparison</Text>

      <View style={cmpStyles.row}>
        <View style={cmpStyles.routeCol}>
          <Text style={cmpStyles.routeName}>Direct</Text>
          <Text style={[cmpStyles.routeScore, { color: pSev.text }]}>
            {primary.safetyScore}/100
          </Text>
          <Text style={cmpStyles.routeTime}>{primary.estimatedTimeDisplay}</Text>
          <View style={[cmpStyles.bar, { borderColor: pSev.border }]}>
            <View
              style={[
                cmpStyles.barFill,
                {
                  width: `${primary.safetyScore}%`,
                  backgroundColor: pSev.solid,
                },
              ]}
            />
          </View>
        </View>

        <View style={cmpStyles.vsWrap}>
          <Text style={cmpStyles.vsText}>VS</Text>
        </View>

        <View style={cmpStyles.routeCol}>
          <Text style={cmpStyles.routeName}>Alternative</Text>
          <Text style={[cmpStyles.routeScore, { color: aSev.text }]}>
            {alternative.safetyScore}/100
          </Text>
          <Text style={cmpStyles.routeTime}>{alternative.estimatedTimeDisplay}</Text>
          <View style={[cmpStyles.bar, { borderColor: aSev.border }]}>
            <View
              style={[
                cmpStyles.barFill,
                {
                  width: `${alternative.safetyScore}%`,
                  backgroundColor: aSev.solid,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={[cmpStyles.verdict, { backgroundColor: safer ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)', borderColor: safer ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
        <Text style={cmpStyles.verdictIcon}>{safer ? '✅' : '⚡'}</Text>
        <Text style={[cmpStyles.verdictText, { color: safer ? '#4ADE80' : '#FBBF24' }]}>
          {safer
            ? `Alternative route is safer (+${alternative.safetyScore - primary.safetyScore} score)`
            : 'Direct route is the safer option'}
        </Text>
      </View>
    </View>
  );
};

const cmpStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card, borderRadius: borderRadius.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    padding: 16, marginBottom: 16,
  },
  title: {
    fontSize: 13, fontWeight: '700', color: colors.text.primary,
    fontFamily: 'SpaceGrotesk-Bold', marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  routeCol: { flex: 1, alignItems: 'center' },
  routeName: { fontSize: 11, color: colors.text.tertiary, fontWeight: '600', marginBottom: 4 },
  routeScore: { fontSize: 22, fontWeight: '800', fontFamily: 'SpaceGrotesk-Bold', marginBottom: 2 },
  routeTime: { fontSize: 11, color: colors.text.secondary, marginBottom: 8 },
  bar: {
    width: '100%', height: 6, borderRadius: 3,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  vsWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: colors.border.subtle, alignItems: 'center',
    justifyContent: 'center', marginHorizontal: 8,
  },
  vsText: { fontSize: 10, fontWeight: '800', color: colors.text.tertiary },
  verdict: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, marginTop: 14,
  },
  verdictIcon: { fontSize: 16 },
  verdictText: { fontSize: 12, fontWeight: '600', flex: 1 },
});

// ─── Section Header ─────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({
  title, subtitle,
}) => (
  <View style={{ marginBottom: 10, marginTop: 8 }}>
    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }}>
      {title}
    </Text>
    {subtitle && (
      <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
        {subtitle}
      </Text>
    )}
  </View>
);

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: colors.border.subtle, alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  backText: { fontSize: 18, color: colors.text.primary },
  title: {
    fontSize: 20, fontWeight: '800', color: colors.text.primary,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },

  // Route Setup Card
  setupCard: {
    backgroundColor: colors.bg.card, borderRadius: borderRadius.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    padding: 16, marginTop: 16, marginBottom: 16,
  },
  routePoint: { flexDirection: 'row', gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routePointInfo: { flex: 1 },
  routePointLabel: {
    fontSize: 9, fontWeight: '700', color: colors.text.tertiary,
    letterSpacing: 1, marginBottom: 6,
  },
  routePointValue: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  connector: { alignItems: 'flex-start', paddingLeft: 5, paddingVertical: 6 },
  connectorLine: { width: 2, height: 20, backgroundColor: colors.border.subtle, borderRadius: 1 },

  // Destination pills
  destPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: colors.border.subtle,
    maxWidth: 180,
  },
  destPillActive: {
    backgroundColor: 'rgba(40,82,255,0.10)',
    borderColor: 'rgba(40,82,255,0.30)',
  },
  destIcon: { fontSize: 14 },
  destText: { fontSize: 11, fontWeight: '600', color: colors.text.tertiary },
  destTextActive: { color: colors.brand.primaryLight },

  // Analyze Button
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.brand.primary, paddingVertical: 14,
    borderRadius: borderRadius.lg, marginBottom: 20,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnIcon: { fontSize: 18 },
  analyzeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Alternative banner
  altBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)',
    marginBottom: 12,
  },
  altBannerIcon: { fontSize: 16 },
  altBannerText: { fontSize: 12, fontWeight: '600', color: '#4ADE80', flex: 1 },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12, borderWidth: 1, borderColor: colors.border.subtle,
    marginBottom: 12,
  },
  disclaimerIcon: { fontSize: 14 },
  disclaimerText: { fontSize: 10, color: colors.text.tertiary, lineHeight: 15, flex: 1 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 6 },
  emptySub: {
    fontSize: 12, color: colors.text.tertiary, textAlign: 'center',
    lineHeight: 18, paddingHorizontal: 20,
  },
});
