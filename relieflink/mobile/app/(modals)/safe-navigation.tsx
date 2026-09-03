import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { colors } from '../../constants/theme';
import {
  findSafeDestinations,
  calculateSafeRoute,
  levelToConfig,
  type SafeDestination,
  type SafeRoute,
  type RouteWarning,
} from '../../services/riskAnalysis';

/**
 * SafeNavigationScreen — AI-powered safe route navigator
 *
 * Shows:
 * - Simulated map with route, hazard zones, and waypoints
 * - Route analysis (distance, time, risk zones, warnings)
 * - Ranked destination cards with safety scores
 * - Alternative routes comparison
 */

export const SafeNavigationScreen: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const destinations = useMemo(() => findSafeDestinations(), []);
  const [selectedId, setSelectedId] = useState(destinations[0]?.id || '');

  const selectedDest = destinations.find((d) => d.id === selectedId) || null;
  const route = useMemo(
    () => (selectedId ? calculateSafeRoute(selectedId) : null),
    [selectedId]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>Safe Navigation</Text>
            <Text style={styles.subtitle}>
              AI-calculated safest route to your destination
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Destination Picker ──────────────────── */}
        <View style={styles.destPickerRow}>
          {destinations.slice(0, 4).map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.destChip,
                d.id === selectedId && styles.destChipActive,
              ]}
              onPress={() => setSelectedId(d.id)}
            >
              <Text style={{ fontSize: 12 }}>{d.icon}</Text>
              <Text
                style={[
                  styles.destChipText,
                  d.id === selectedId && styles.destChipTextActive,
                ]}
                numberOfLines={1}
              >
                {d.name.split(' ').slice(0, 2).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Simulated Map ───────────────────────── */}
        <View style={styles.mapArea}>
          <View style={styles.mapBg}>
            {/* Grid lines */}
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={`h${i}`}
                style={[
                  styles.gridLine,
                  { top: `${(i + 1) * 16}%`, width: '100%', height: 1 },
                ]}
              />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`v${i}`}
                style={[
                  styles.gridLine,
                  {
                    left: `${(i + 1) * 12}%`,
                    height: '100%',
                    width: 1,
                  },
                ]}
              />
            ))}

            {/* Route line */}
            {route && (
              <View style={styles.routeLine}>
                <View style={styles.routeLineInner} />
              </View>
            )}

            {/* Start point */}
            <View style={[styles.mapPin, styles.startPin]}>
              <View style={styles.pinDotBlue} />
              <Text style={styles.pinLabel}>You</Text>
            </View>

            {/* Destination point */}
            {selectedDest && (
              <View style={[styles.mapPin, styles.endPin]}>
                <View style={styles.pinDotGreen} />
                <Text style={styles.pinLabel} numberOfLines={1}>
                  {selectedDest.icon}
                </Text>
              </View>
            )}

            {/* Hazard zones on map */}
            {route?.warnings.map((w, i) => (
              <View
                key={w.id}
                style={[
                  styles.mapHazard,
                  {
                    top: `${30 + i * 15}%`,
                    left: `${35 + i * 10}%`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.hazardCircle,
                    {
                      backgroundColor:
                        levelToConfig(w.severity).color + '15',
                      borderColor:
                        levelToConfig(w.severity).color + '30',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 10 }}>
                    {w.type === 'blocked_road' ? '🚧' : '⚠️'}
                  </Text>
                </View>
              </View>
            ))}

            {/* Waypoint markers */}
            {route?.waypoints
              .filter((wp) => wp.type === 'turn' || wp.type === 'checkpoint')
              .map((wp, i) => (
                <View
                  key={i}
                  style={[
                    styles.mapPin,
                    {
                      top: `${40 + i * 18}%`,
                      left: `${25 + i * 20}%`,
                    },
                  ]}
                >
                  <View style={styles.waypointDot} />
                </View>
              ))}

            {/* Map label */}
            <View style={styles.mapLabelWrap}>
              <Text style={styles.mapLabelText}>
                🤖 AI-Generated Safe Route
              </Text>
            </View>
          </View>
        </View>

        {/* ── Route Info Card ─────────────────────── */}
        {route && selectedDest && (
          <View>
            {/* Main route card */}
            <View style={[styles.routeCard, { borderLeftColor: levelToConfig(selectedDest.safetyLevel).color }]}>
              <View style={styles.routeCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>Safest Route Found</Text>
                  <Text style={styles.routeSubtitle}>
                    Via {route.viaRoute}
                  </Text>
                </View>
                <View
                  style={[
                    styles.safetyBadge,
                    {
                      backgroundColor:
                        levelToConfig(selectedDest.safetyLevel).bg,
                      borderColor:
                        levelToConfig(selectedDest.safetyLevel).color + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.safetyBadgeText,
                      {
                        color: levelToConfig(selectedDest.safetyLevel).color,
                      },
                    ]}
                  >
                    Safety {selectedDest.safetyScore}
                  </Text>
                </View>
              </View>

              {/* Route stats */}
              <View style={styles.statsRow}>
                <StatItem value={`${route.distanceKm} km`} label="Distance" />
                <View style={styles.statSep} />
                <StatItem
                  value={`${route.driveTimeMin} min`}
                  label="Drive"
                />
                <View style={styles.statSep} />
                <StatItem
                  value={`${route.walkingTimeMin} min`}
                  label="Walking"
                />
                <View style={styles.statSep} />
                <StatItem
                  value={`${route.riskZonesCrossed}`}
                  label="Risk Zones"
                  valueColor={
                    route.riskZonesCrossed === 0 ? '#4ADE80' : '#FBBF24'
                  }
                />
              </View>

              {/* Warnings */}
              {route.warnings.length > 0 && (
                <View style={styles.warningsWrap}>
                  <Text style={styles.warningsTitle}>
                    Route Warnings ({route.warnings.length})
                  </Text>
                  {route.warnings.map((w) => (
                    <WarningItem key={w.id} warning={w} />
                  ))}
                </View>
              )}

              {route.warnings.length === 0 && (
                <View style={styles.allClearBanner}>
                  <Text style={{ fontSize: 14 }}>✅</Text>
                  <Text style={styles.allClearText}>
                    No hazards on this route. Clear path to destination.
                  </Text>
                </View>
              )}

              {/* Start navigation button */}
              <TouchableOpacity style={styles.startNavBtn} activeOpacity={0.85}>
                <Text style={styles.startNavText}>Start Navigation</Text>
                <Text style={styles.startNavIcon}>→</Text>
              </TouchableOpacity>
            </View>

            {/* ── Alternative Routes ──────────────── */}
            {route.alternativeRoutes.length > 0 && (
              <View style={styles.altSection}>
                <Text style={styles.altTitle}>Alternative Routes</Text>
                {route.alternativeRoutes.map((alt, i) => (
                  <View key={i} style={styles.altCard}>
                    <View style={styles.altTop}>
                      <Text style={styles.altVia}>{alt.viaRoute}</Text>
                      <View
                        style={[
                          styles.altBadge,
                          alt.recommended
                            ? styles.altBadgeGood
                            : styles.altBadgeNeutral,
                        ]}
                      >
                        <Text
                          style={[
                            styles.altBadgeText,
                            {
                              color: alt.recommended ? '#4ADE80' : colors.text.tertiary,
                            },
                          ]}
                        >
                          {alt.recommended ? 'Recommended' : 'Alternative'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.altStats}>
                      <Text style={styles.altStat}>
                        📍 {alt.distanceKm} km
                      </Text>
                      <Text style={styles.altStat}>
                        🕐 {alt.driveTimeMin} min
                      </Text>
                      <Text style={styles.altStat}>
                        Safety: {alt.safetyScore}
                      </Text>
                      <Text
                        style={[
                          styles.altStat,
                          {
                            color:
                              alt.riskZonesCrossed === 0
                                ? '#4ADE80'
                                : '#FBBF24',
                          },
                        ]}
                      >
                        ⚠️ {alt.riskZonesCrossed} risk zones
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── All Destinations Ranked ─────────────── */}
        <View style={styles.destSection}>
          <Text style={styles.destSectionTitle}>
            All Safe Destinations (Ranked by Safety)
          </Text>
          {destinations.map((d, i) => (
            <DestinationCard
              key={d.id}
              destination={d}
              rank={i + 1}
              isSelected={d.id === selectedId}
              onSelect={() => setSelectedId(d.id)}
            />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ──────────────────────────────────────

const StatItem: React.FC<{
  value: string;
  label: string;
  valueColor?: string;
}> = ({ value, label, valueColor }) => (
  <View style={styles.statItem}>
    <Text
      style={[styles.statValue, valueColor ? { color: valueColor } : null]}
    >
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const WarningItem: React.FC<{ warning: RouteWarning }> = ({ warning }) => {
  const config = levelToConfig(warning.severity);
  return (
    <View style={styles.warningItem}>
      <View
        style={[
          styles.warningIcon,
          {
            backgroundColor: config.color + '10',
            borderColor: config.color + '18',
          },
        ]}
      >
        <Text style={{ fontSize: 12 }}>
          {warning.type === 'blocked_road' ? '🚧' : '⚠️'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.warningTitle, { color: config.color }]}>
          {warning.title}
        </Text>
        <Text style={styles.warningDesc} numberOfLines={2}>
          {warning.description}
        </Text>
      </View>
    </View>
  );
};

const DestinationCard: React.FC<{
  destination: SafeDestination;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ destination: d, rank, isSelected, onSelect }) => {
  const config = levelToConfig(d.safetyLevel);

  return (
    <TouchableOpacity
      style={[
        styles.destCard,
        isSelected && { borderColor: config.color + '40', backgroundColor: config.color + '08' },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.destCardTop}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.destIcon}>
          <Text style={{ fontSize: 20 }}>{d.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.destName} numberOfLines={1}>
            {d.name}
          </Text>
          <Text style={styles.destAddr} numberOfLines={1}>
            {d.address}
          </Text>
        </View>
        <View
          style={[
            styles.destSafety,
            {
              backgroundColor: config.bg,
              borderColor: config.color + '20',
            },
          ]}
        >
          <Text style={[styles.destSafetyScore, { color: config.color }]}>
            {d.safetyScore}
          </Text>
          <Text style={styles.destSafetyLabel}>Safety</Text>
        </View>
      </View>

      <View style={styles.destStats}>
        <Text style={styles.destStat}>📍 {d.distanceKm} km</Text>
        <Text style={styles.destStat}>🚗 {d.travelTimeMin} min</Text>
        <Text style={styles.destStat}>🚶 {d.walkingTimeMin} min</Text>
        {d.availableSpots >= 0 && (
          <Text
            style={[
              styles.destStat,
              {
                color:
                  d.availableSpots > 200
                    ? '#4ADE80'
                    : d.availableSpots > 100
                      ? '#FBBF24'
                      : '#F87171',
              },
            ]}
          >
            🛏️ {d.availableSpots} spots
          </Text>
        )}
        <Text
          style={[
            styles.destStat,
            {
              color: d.routeRiskZones === 0 ? '#4ADE80' : '#FBBF24',
            },
          ]}
        >
          ⚠️ {d.routeRiskZones} risk zones
        </Text>
      </View>

      {/* Facilities */}
      <View style={styles.facilityRow}>
        {d.facilities.slice(0, 4).map((f, i) => (
          <View key={i} style={styles.facilityPill}>
            <Text style={styles.facilityText}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, color: colors.text.secondary },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Destination picker
  destPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    maxWidth: '48%',
  },
  destChipActive: {
    backgroundColor: 'rgba(40,82,255,0.12)',
    borderColor: 'rgba(40,82,255,0.25)',
  },
  destChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  destChipTextActive: {
    color: '#7E98FF',
  },

  // Map
  mapArea: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  mapBg: {
    flex: 1,
    backgroundColor: '#080D18',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(148,163,184,0.04)',
  },
  routeLine: {
    position: 'absolute',
    top: '28%',
    left: '18%',
    width: '64%',
    height: 12,
    transform: [{ rotate: '12deg' }],
  },
  routeLineInner: {
    flex: 1,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  startPin: { top: '22%', left: '14%' },
  endPin: { bottom: '18%', right: '14%' },
  pinDotBlue: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinDotGreen: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 3,
  },
  mapHazard: {
    position: 'absolute',
    zIndex: 1,
  },
  hazardCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  waypointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(40,82,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.8)',
  },
  mapLabelWrap: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mapLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.secondary,
  },

  // Route card
  routeCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftWidth: 3,
    marginBottom: 16,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 3,
  },
  routeSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  safetyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  safetyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSep: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },

  // Warnings
  warningsWrap: {
    marginBottom: 14,
  },
  warningsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  warningItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  warningIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 16,
  },

  allClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  allClearText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#4ADE80',
  },

  startNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  startNavText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startNavIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Alternative routes
  altSection: {
    marginBottom: 16,
  },
  altTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  altCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 8,
  },
  altTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  altVia: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  altBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  altBadgeGood: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  altBadgeNeutral: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  altBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  altStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  altStat: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },

  // Destination cards
  destSection: {
    marginTop: 4,
  },
  destSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  destCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  destCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(40,82,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E98FF',
  },
  destIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  destName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  destAddr: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  destSafety: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  destSafetyScore: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  destSafetyLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  destStat: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  facilityRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  facilityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  facilityText: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});
