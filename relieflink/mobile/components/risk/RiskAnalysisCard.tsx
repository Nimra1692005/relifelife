import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../../constants/theme';
import {
  analyzeRisk,
  findSafeDestinations,
  levelToConfig,
  type RiskAssessment,
  type SafeDestination,
  type RiskFactor,
  type HazardProximity,
} from '../../services/riskAnalysis';

/**
 * RiskAnalysisCard — AI-powered risk visualization for the home screen.
 *
 * Shows:
 * - Overall safety score with animated gauge
 * - Risk level with color-coded indicator
 * - Risk factor breakdown bars
 * - Top safe destination recommendation
 * - Nearby hazard summary
 */

interface RiskAnalysisCardProps {
  onPressDetails?: () => void;
  onPressNavigate?: () => void;
}

const hazardIcons: Record<string, string> = {
  flood: '🌊',
  landslide: '⛰️',
  blocked_road: '🚧',
  fire: '🔥',
  collapse: '🏚️',
};

export const RiskAnalysisCard: React.FC<RiskAnalysisCardProps> = ({
  onPressDetails,
  onPressNavigate,
}) => {
  const riskData = useMemo(() => analyzeRisk(), []);
  const destinations = useMemo(() => findSafeDestinations(), []);
  const bestDest = destinations[0];

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scoreAnim, {
        toValue: riskData.overallScore,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const sev = levelToConfig(riskData.level);

  // Score circle arc (0-100 mapped to 0-270 degrees)
  const scoreRotation = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 270],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeIn }]}>
      {/* ── AI Analysis Badge ─────────────────────── */}
      <View style={styles.aiBadge}>
        <Text style={{ fontSize: 10 }}>🤖</Text>
        <Text style={styles.aiBadgeText}>AI Risk Analysis</Text>
      </View>

      {/* ── Main Card ────────────────────────────── */}
      <View style={[styles.card, { borderLeftColor: sev.color }]}>
        {/* Top row: Score + Info */}
        <View style={styles.topRow}>
          {/* Score gauge */}
          <View style={styles.gaugeWrap}>
            <View
              style={[
                styles.gaugeOuter,
                {
                  borderColor: sev.color + '30',
                  shadowColor: sev.glow,
                },
              ]}
            >
              <View style={styles.gaugeInner}>
                <Animated.Text
                  style={[styles.scoreValue, { color: sev.color }]}
                >
                  {riskData.overallScore}
                </Animated.Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              {/* Arc indicator (simulated with border) */}
              <Animated.View
                style={[
                  styles.gaugeArc,
                  {
                    borderColor: sev.color,
                    transform: [{ rotate: scoreRotation }],
                  },
                ]}
              />
            </View>
          </View>

          {/* Info column */}
          <View style={styles.infoColumn}>
            <View style={[styles.levelPill, { backgroundColor: sev.bg }]}>
              <View style={[styles.levelDot, { backgroundColor: sev.color }]} />
              <Text style={[styles.levelText, { color: sev.color }]}>
                {sev.label}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {riskData.description}
            </Text>
            <View style={styles.updatedRow}>
              <Text style={{ fontSize: 9 }}>🕐</Text>
              <Text style={styles.updatedText}>
                Updated {riskData.lastUpdated}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Risk Factor Bars ────────────────────── */}
        <View style={styles.factorsSection}>
          <Text style={styles.factorsTitle}>Risk Breakdown</Text>
          {riskData.factors.map((f, i) => (
            <FactorBar key={i} factor={f} />
          ))}
        </View>

        {/* ── Nearby Hazards Summary ──────────────── */}
        {riskData.nearbyHazards.length > 0 && (
          <View style={styles.hazardsSection}>
            <Text style={styles.hazardsTitle}>
              Nearby Hazards ({riskData.nearbyHazards.length})
            </Text>
            <View style={styles.hazardChips}>
              {riskData.nearbyHazards.slice(0, 3).map((h) => (
                <HazardChip key={h.id} hazard={h} />
              ))}
            </View>
          </View>
        )}

        {/* ── Best Destination Recommendation ─────── */}
        {bestDest && (
          <View style={styles.recommendSection}>
            <Text style={styles.recommendTitle}>
              🛡️ Recommended Safe Destination
            </Text>
            <TouchableOpacity
              style={styles.recommendCard}
              activeOpacity={0.7}
              onPress={onPressNavigate}
            >
              <View style={styles.recommendIcon}>
                <Text style={{ fontSize: 20 }}>{bestDest.icon}</Text>
              </View>
              <View style={styles.recommendInfo}>
                <Text style={styles.recommendName} numberOfLines={1}>
                  {bestDest.name}
                </Text>
                <Text style={styles.recommendMeta}>
                  {bestDest.distanceKm} km • {bestDest.travelTimeMin} min drive
                  {bestDest.availableSpots >= 0 &&
                    ` • ${bestDest.availableSpots} spots`}
                </Text>
              </View>
              <View
                style={[
                  styles.safetyBadge,
                  {
                    backgroundColor:
                      levelToConfig(bestDest.safetyLevel).bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.safetyBadgeText,
                    {
                      color: levelToConfig(bestDest.safetyLevel).color,
                    },
                  ]}
                >
                  {bestDest.safetyScore}
                </Text>
              </View>
              <Text style={styles.recommendArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Actions ────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={onPressDetails}
          >
            <Text style={styles.viewDetailsText}>View Full Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navigateBtn, { backgroundColor: sev.color }]}
            onPress={onPressNavigate}
          >
            <Text style={styles.navigateBtnText}>Safe Route →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Factor Bar Sub-component ────────────────────────────

const FactorBar: React.FC<{ factor: RiskFactor }> = ({ factor }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const config = levelToConfig(factor.level);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: factor.score,
      duration: 1000,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.factorRow}>
      <Text style={styles.factorLabel} numberOfLines={1}>
        {factor.label}
      </Text>
      <View style={styles.factorBarBg}>
        <Animated.View
          style={[
            styles.factorBarFill,
            {
              width: fillAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: config.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.factorValue, { color: config.color }]}>
        {factor.score}
      </Text>
    </View>
  );
};

// ─── Hazard Chip Sub-component ───────────────────────────

const HazardChip: React.FC<{ hazard: HazardProximity }> = ({ hazard }) => {
  const config = levelToConfig(hazard.severity);

  return (
    <View
      style={[
        styles.hazardChip,
        { borderColor: config.color + '25' },
      ]}
    >
      <Text style={{ fontSize: 11 }}>
        {hazardIcons[hazard.type] || '⚠️'}
      </Text>
      <Text style={styles.hazardChipLabel} numberOfLines={1}>
        {hazard.label}
      </Text>
      <Text style={[styles.hazardChipDist, { color: config.color }]}>
        {hazard.distanceKm} km
      </Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(40,82,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.15)',
    marginBottom: 8,
    marginLeft: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E98FF',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftWidth: 3,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  gaugeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  gaugeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: -2,
  },
  gaugeArc: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  infoColumn: {
    flex: 1,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
  },
  levelDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updatedText: {
    fontSize: 10,
    color: colors.text.tertiary,
  },

  // Risk factors
  factorsSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  factorsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  factorLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    width: 100,
  },
  factorBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorValue: {
    fontSize: 11,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
    fontFamily: 'JetBrains Mono',
  },

  // Hazards
  hazardsSection: {
    marginBottom: 14,
  },
  hazardsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  hazardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hazardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  hazardChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
    maxWidth: 120,
  },
  hazardChipDist: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Recommendation
  recommendSection: {
    marginBottom: 14,
  },
  recommendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  recommendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: 10,
  },
  recommendIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendInfo: {
    flex: 1,
  },
  recommendName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  recommendMeta: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  safetyBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  recommendArrow: {
    fontSize: 18,
    color: colors.text.tertiary,
    fontWeight: '300',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewDetailsBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  navigateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  navigateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
