import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

/**
 * AlertCard — Disaster alert card for mobile feed
 * Shows disaster type, severity, location, and time
 */

type DisasterType = 'flood' | 'earthquake' | 'fire' | 'landslide' | 'storm' | 'extreme_rain';
type Severity = 'low' | 'medium' | 'high' | 'critical';

interface AlertCardProps {
  disasterType: DisasterType;
  severity: Severity;
  title: string;
  location: string;
  time: string;
  distance?: string;
  onPress?: () => void;
}

const disasterEmoji: Record<DisasterType, string> = {
  flood: '🌊',
  earthquake: '🫨',
  fire: '🔥',
  landslide: '⛰️',
  storm: '🌪️',
  extreme_rain: '🌧️',
};

const severityConfig: Record<Severity, { color: string; bg: string; label: string }> = {
  low: { color: '#A3E635', bg: 'rgba(132, 204, 22, 0.12)', label: 'LOW' },
  medium: { color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.12)', label: 'MEDIUM' },
  high: { color: '#F87171', bg: 'rgba(239, 68, 68, 0.12)', label: 'HIGH' },
  critical: { color: '#FB7185', bg: 'rgba(244, 63, 94, 0.15)', label: 'CRITICAL' },
};

export const AlertCard: React.FC<AlertCardProps> = ({
  disasterType,
  severity,
  title,
  location,
  time,
  distance,
  onPress,
}) => {
  const sev = severityConfig[severity];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { borderLeftColor: sev.color }]}
    >
      {/* Top row: icon + severity */}
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>{disasterEmoji[disasterType]}</Text>
        </View>
        <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
          <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
          <Text style={[styles.severityText, { color: sev.color }]}>
            {sev.label}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Bottom row: location + time */}
      <View style={styles.bottomRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        {distance && (
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * SafetyScoreGauge — Circular animated safety score indicator
 * Shows 0–100 score with color-coded arc
 */

interface SafetyScoreGaugeProps {
  score: number; // 0–100
  label?: string;
  size?: number;
}

export const SafetyScoreGauge: React.FC<SafetyScoreGaugeProps> = ({
  score,
  label,
  size = 120,
}) => {
  const getColor = (s: number) => {
    if (s >= 80) return '#22C55E';
    if (s >= 60) return '#84CC16';
    if (s >= 40) return '#F59E0B';
    if (s >= 20) return '#EF4444';
    return '#F43F5E';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Safe';
    if (s >= 60) return 'Mostly Safe';
    if (s >= 40) return 'Caution';
    if (s >= 20) return 'High Risk';
    return 'Danger';
  };

  const color = getColor(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.gaugeBg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      {/* Score text */}
      <View style={styles.gaugeContent}>
        <Text style={[styles.gaugeScore, { color }]}>{score}</Text>
        <Text style={styles.gaugeLabel}>{label || getLabel(score)}</Text>
      </View>
      {/* Glow effect */}
      <View
        style={[
          styles.gaugeGlow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            shadowColor: color,
            position: 'absolute',
          },
        ]}
      />
    </View>
  );
};

/**
 * DisasterTypeIcon — Small icon with emoji + color for disaster types
 */

interface DisasterTypeIconProps {
  type: DisasterType;
  size?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: { container: 28, emoji: 14 },
  md: { container: 36, emoji: 18 },
  lg: { container: 44, emoji: 22 },
};

export const DisasterTypeIcon: React.FC<DisasterTypeIconProps> = ({
  type,
  size = 'md',
}) => {
  const s = iconSizes[size];
  return (
    <View
      style={[
        styles.disasterIcon,
        {
          width: s.container,
          height: s.container,
          borderRadius: s.container / 2.5,
        },
      ]}
    >
      <Text style={{ fontSize: s.emoji }}>{disasterEmoji[type]}</Text>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  // AlertCard
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.card,
    padding: spacing[4],
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftColor: colors.severity.medium.solid,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[2.5],
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  metaIcon: {
    fontSize: 10,
  },
  metaText: {
    fontSize: 11,
    color: colors.text.tertiary,
    flexShrink: 1,
  },
  distancePill: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  timeText: {
    fontSize: 10,
    color: colors.text.tertiary,
  },

  // SafetyScoreGauge
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeBg: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'absolute',
  },
  gaugeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScore: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
    letterSpacing: -1,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  gaugeGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },

  // DisasterTypeIcon
  disasterIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
