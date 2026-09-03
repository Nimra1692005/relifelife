import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../constants/theme';
import {
  mockUser,
  mockLocation,
  mockAlerts,
  mockShelters,
} from '../../utils/sampleData';
import {
  QuickActionCard,
  ShelterCard,
  SectionHeader,
  GlassCard,
} from '../../components/shared/SharedComponents';
import { SOSButton } from '../../components/sos/SOSButton';
import { RiskAnalysisCard } from '../../components/risk/RiskAnalysisCard';
import { levelToConfig } from '../../services/riskAnalysis';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Assalam-o-Alaikum,{' '}
              <Text style={styles.greetingName}>
                {mockUser.full_name.split(' ')[0]}
              </Text>
            </Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{mockLocation.address}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => navigation?.navigate('notifications')}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── AI Risk Analysis Card ──────────────────────── */}
        <RiskAnalysisCard
          onPressNavigate={() => navigation?.navigate('safe-navigation')}
          onPressDetails={() => navigation?.navigate('safe-navigation')}
        />

        {/* ── Quick Actions ───────────────────────────────── */}
        <SectionHeader title="Quick Actions" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          <QuickActionCard icon="🏥" label="Find Safe Place" accent="#22C55E" />
          <QuickActionCard icon="🏨" label="Nearby Hospital" accent="#EF4444" />
          <QuickActionCard icon="📞" label="Emergency Call" accent="#F59E0B" />
          <QuickActionCard icon="⚠️" label="Disaster Alerts" accent="#6366F1" />
          <QuickActionCard icon="🗺️" label="Safe Route" accent="#0EA5E9" />
        </ScrollView>

        {/* ── Active Alert Banner ─────────────────────────── */}
        {mockAlerts[0] && (
          <TouchableOpacity
            style={[
              styles.alertBanner,
              { borderLeftColor: levelToConfig(mockAlerts[0].severity as any).color },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.alertBannerLeft}>
              <Text style={{ fontSize: 20 }}>
                {mockAlerts[0].disasterType === 'flood' ? '🌊' : '⚠️'}
              </Text>
            </View>
            <View style={styles.alertBannerInfo}>
              <Text style={styles.alertBannerTitle} numberOfLines={1}>
                {mockAlerts[0].title}
              </Text>
              <Text style={styles.alertBannerMeta}>
                {mockAlerts[0].distance} • {mockAlerts[0].time}
              </Text>
            </View>
            <Text style={styles.alertBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── SOS Emergency Section ───────────────────────── */}
        <View style={styles.sosSection}>
          <GlassCard style={styles.sosCard}>
            <View style={styles.sosContent}>
              <View style={styles.sosInfo}>
                <Text style={styles.sosTitle}>I Need Help</Text>
                <Text style={styles.sosSubtitle}>
                  Tap the SOS button to send your location to rescue teams
                  instantly
                </Text>
              </View>
              <View style={styles.sosButtonArea}>
                <SOSButton onPress={() => {}} size={100} />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ── Nearby Shelters ─────────────────────────────── */}
        <SectionHeader title="Nearby Safe Places" action="See All" />
        {mockShelters.slice(0, 3).map((shelter) => (
          <ShelterCard key={shelter.id} {...shelter} />
        ))}

        {/* ── AI Assistant Card ───────────────────────────── */}
        <SectionHeader title="AI Assistant" />
        <TouchableOpacity activeOpacity={0.7} style={styles.aiCard}>
          <View style={styles.aiCardInner}>
            <View style={styles.aiIconContainer}>
              <View style={styles.aiIconGlow} />
              <View style={styles.aiIcon}>
                <Text style={{ fontSize: 24 }}>🤖</Text>
              </View>
            </View>
            <View style={styles.aiText}>
              <Text style={styles.aiTitle}>Emergency AI Assistant</Text>
              <Text style={styles.aiSubtitle}>
                Ask me anything in English, اردو, or Roman Urdu
              </Text>
              <View style={styles.aiPromptRow}>
                <Text style={styles.aiPromptIcon}>💬</Text>
                <Text style={styles.aiPrompt}>
                  "How can I stay safe during a flood?"
                </Text>
              </View>
            </View>
            <Text style={styles.aiArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Bottom spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  greetingName: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bg.base,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Safety Card
  safetyCard: {
    marginBottom: 24,
    borderLeftWidth: 3,
  },
  safetyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  safetyScoreContainer: {
    marginRight: 16,
  },
  safetyScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  safetyScore: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
    letterSpacing: -1,
  },
  safetyScoreLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500',
    marginTop: -2,
  },
  safetyInfo: {
    flex: 1,
  },
  safetyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyLevel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safetyDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  safetyUpdated: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  riskFactors: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  riskFactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riskFactorLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    width: 100,
    fontWeight: '500',
  },
  riskFactorBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  riskFactorFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Quick Actions
  quickActionsRow: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftWidth: 3,
  },
  alertBannerLeft: {
    marginRight: 12,
  },
  alertBannerInfo: {
    flex: 1,
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  alertBannerMeta: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  alertBannerArrow: {
    fontSize: 18,
    color: colors.text.tertiary,
    marginLeft: 8,
  },

  // SOS Section
  sosSection: {
    marginBottom: 28,
  },
  sosCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.04)',
    borderColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  sosContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosInfo: {
    flex: 1,
    marginRight: 16,
  },
  sosTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F87171',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 6,
  },
  sosSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  sosButtonArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // AI Card
  aiCard: {
    marginBottom: 12,
  },
  aiCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  aiIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiIconGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(40, 82, 255, 0.1)',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(40, 82, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(40, 82, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 3,
  },
  aiSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 8,
  },
  aiPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  aiPromptIcon: {
    fontSize: 12,
  },
  aiPrompt: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  aiArrow: {
    fontSize: 20,
    color: colors.brand.primaryLight,
    marginLeft: 8,
    fontWeight: '600',
  },
});
