import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

/* ─── Quick Action Card ─────────────────────────────────── */

interface QuickActionCardProps {
  icon: string;
  label: string;
  onPress?: () => void;
  accent?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  label,
  onPress,
  accent = colors.brand.primary,
}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: accent + '15' }]}>
      <Text style={styles.quickActionEmoji}>{icon}</Text>
    </View>
    <Text style={styles.quickActionLabel} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ─── Shelter Card ──────────────────────────────────────── */

interface ShelterCardProps {
  name: string;
  type: string;
  address: string;
  distance: string;
  travelTime: string;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  verified?: boolean;
  onPress?: () => void;
}

const typeIcons: Record<string, string> = {
  shelter: '🏠',
  hospital: '🏥',
  relief_camp: '⛺',
  mosque: '🕌',
  school: '🏫',
};

export const ShelterCard: React.FC<ShelterCardProps> = ({
  name,
  type,
  address,
  distance,
  travelTime,
  capacity,
  currentOccupancy,
  facilities,
  verified,
  onPress,
}) => {
  const occupancyPercent = Math.round((currentOccupancy / capacity) * 100);
  const spotsLeft = capacity - currentOccupancy;

  return (
    <TouchableOpacity style={styles.shelterCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.shelterCardTop}>
        <View style={styles.shelterTypeIcon}>
          <Text style={{ fontSize: 18 }}>{typeIcons[type] || '🏠'}</Text>
        </View>
        <View style={styles.shelterInfo}>
          <Text style={styles.shelterName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.shelterAddress} numberOfLines={1}>
            {address}
          </Text>
        </View>
        {verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>

      {/* Capacity bar */}
      <View style={styles.capacityRow}>
        <View style={styles.capacityBarBg}>
          <View
            style={[
              styles.capacityBarFill,
              {
                width: `${occupancyPercent}%`,
                backgroundColor:
                  occupancyPercent > 80
                    ? '#EF4444'
                    : occupancyPercent > 60
                      ? '#F59E0B'
                      : '#22C55E',
              },
            ]}
          />
        </View>
        <Text style={styles.capacityText}>
          {spotsLeft} spots left
        </Text>
      </View>

      {/* Bottom row */}
      <View style={styles.shelterBottom}>
        <View style={styles.shelterMeta}>
          <Text style={styles.shelterMetaIcon}>📍</Text>
          <Text style={styles.shelterMetaText}>{distance}</Text>
        </View>
        <View style={styles.shelterMeta}>
          <Text style={styles.shelterMetaIcon}>🕐</Text>
          <Text style={styles.shelterMetaText}>{travelTime}</Text>
        </View>
        <View style={styles.facilityRow}>
          {facilities.slice(0, 3).map((f, i) => (
            <View key={i} style={styles.facilityPill}>
              <Text style={styles.facilityText}>{f}</Text>
            </View>
          ))}
          {facilities.length > 3 && (
            <Text style={styles.facilityMore}>+{facilities.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ─── Section Header ────────────────────────────────────── */

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  onAction,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ─── Glass Card Wrapper ────────────────────────────────── */

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
}) => {
  const content = (
    <View style={[styles.glassCard, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

/* ─── Styles ────────────────────────────────────────────── */

const styles = StyleSheet.create({
  // Quick Action
  quickAction: {
    alignItems: 'center',
    width: 80,
    marginRight: 12,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Shelter Card
  shelterCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  shelterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shelterTypeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  shelterInfo: {
    flex: 1,
    marginRight: 8,
  },
  shelterName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  shelterAddress: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  capacityBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
    width: 80,
    textAlign: 'right',
  },
  shelterBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  shelterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  shelterMetaIcon: {
    fontSize: 10,
  },
  shelterMetaText: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  facilityPill: {
    paddingHorizontal: 7,
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
  facilityMore: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.tertiary,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.primary,
  },

  // Glass Card
  glassCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
});
