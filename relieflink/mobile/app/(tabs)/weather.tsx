/**
 * ReliefLink — Weather Intelligence Screen
 *
 * Features:
 *   1. Current weather card (temp, condition, humidity, wind)
 *   2. 24-hour forecast strip
 *   3. Smart weather alerts (severity-coded)
 *   4. AI-assisted combined risk assessment
 *   5. Route safety quick action
 *
 * Uses existing design tokens, glass cards, severity colors.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius } from '../../constants/theme';
import { weatherService, type WeatherData, type WeatherWarning } from '../../services/weatherService';
import {
  analyzeCombinedRisk,
  type CombinedRiskResult,
} from '../../services/combinedRisk';

// ─── Severity Config ────────────────────────────────────────

const severityStyle: Record<string, { bg: string; text: string; border: string; solid: string }> = {
  safe:     { bg: 'rgba(34,197,94,0.06)', text: '#4ADE80', border: 'rgba(34,197,94,0.20)', solid: '#22C55E' },
  normal:   { bg: 'rgba(34,197,94,0.06)', text: '#4ADE80', border: 'rgba(34,197,94,0.20)', solid: '#22C55E' },
  low:      { bg: 'rgba(132,204,22,0.06)', text: '#A3E635', border: 'rgba(132,204,22,0.20)', solid: '#84CC16' },
  medium:   { bg: 'rgba(245,158,11,0.06)', text: '#FBBF24', border: 'rgba(245,158,11,0.20)', solid: '#F59E0B' },
  high:     { bg: 'rgba(239,68,68,0.06)', text: '#F87171', border: 'rgba(239,68,68,0.20)', solid: '#EF4444' },
  critical: { bg: 'rgba(244,63,94,0.06)', text: '#FB7185', border: 'rgba(244,63,94,0.20)', solid: '#F43F5E' },
  severe:   { bg: 'rgba(244,63,94,0.06)', text: '#FB7185', border: 'rgba(244,63,94,0.20)', solid: '#F43F5E' },
  warning:  { bg: 'rgba(245,158,11,0.06)', text: '#FBBF24', border: 'rgba(245,158,11,0.20)', solid: '#F59E0B' },
  advisory: { bg: 'rgba(14,165,233,0.06)', text: '#38BDF8', border: 'rgba(14,165,233,0.20)', solid: '#0EA5E9' },
};

function getSev(key: string) {
  return severityStyle[key] || severityStyle.medium;
}

// ─── Glass Card ─────────────────────────────────────────────

const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: any;
  severity?: string;
}> = ({ children, style, severity }) => {
  const sev = severity ? getSev(severity) : null;
  return (
    <View
      style={[
        gcStyles.card,
        sev && { borderColor: sev.border, backgroundColor: sev.bg },
        style,
      ]}
    >
      {children}
    </View>
  );
};
const gcStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 16,
    marginBottom: 16,
  },
});

// ─── Section Header ─────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <View style={shStyles.wrap}>
    <Text style={shStyles.title}>{title}</Text>
    {subtitle && <Text style={shStyles.subtitle}>{subtitle}</Text>}
  </View>
);
const shStyles = StyleSheet.create({
  wrap: { marginBottom: 10, marginTop: 8 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' },
  subtitle: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
});

// ─── Main Screen ────────────────────────────────────────────

interface WeatherScreenProps {
  navigation?: any;
}

export const WeatherScreen: React.FC<WeatherScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [risk, setRisk] = useState<CombinedRiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [weatherData, riskData] = await Promise.all([
        weatherService.getWeather(),
        analyzeCombinedRisk(),
      ]);
      setWeather(weatherData);
      setRisk(riskData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Loading weather data...</Text>
          <Text style={styles.loadingSub}>Using mock data — connect a weather API in production</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error State ────────────────────────────────────────
  if (error || !weather) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Weather Unavailable</Text>
          <Text style={styles.errorSub}>{error || 'Could not load weather data'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sev = getSev(weather.warnings.length > 0
    ? weatherService.getHighestWarningSeverity(weather.warnings)
    : 'normal');

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
            <Text style={styles.headerTitle}>Weather Intelligence</Text>
            <View style={styles.locationRow}>
              <Text style={{ fontSize: 12 }}>📍</Text>
              <Text style={styles.locationText}>{weather.location}</Text>
            </View>
          </View>
          <View style={[styles.sourceBadge, { borderColor: sev.border }]}>
            <Text style={[styles.sourceText, { color: sev.text }]}>
              {weather.source.includes('Mock') ? 'MOCK DATA' : 'LIVE'}
            </Text>
          </View>
        </View>

        {/* ── FEATURE 1: Current Weather Card ─────────────── */}
        <GlassCard>
          <View style={styles.weatherTop}>
            <View style={styles.tempBlock}>
              <Text style={styles.tempIcon}>{weather.current.icon}</Text>
              <Text style={styles.tempValue}>{weather.current.temperature}°</Text>
              <Text style={styles.tempUnit}>Celsius</Text>
            </View>
            <View style={styles.weatherInfo}>
              <Text style={styles.conditionLabel}>{weather.current.conditionLabel}</Text>
              <Text style={styles.feelsLike}>
                Feels like {weather.current.feelsLike}°C
              </Text>
              <View style={styles.rainPill}>
                <Text style={{ fontSize: 12 }}>🌧️</Text>
                <Text style={styles.rainText}>
                  {weather.current.rainProbability}% chance of rain
                </Text>
              </View>
            </View>
          </View>

          {/* Weather metrics grid */}
          <View style={styles.metricsGrid}>
            <MetricCell icon="💧" label="Humidity" value={`${weather.current.humidity}%`} />
            <MetricCell icon="💨" label="Wind" value={`${weather.current.windSpeed} km/h`} />
            <MetricCell icon="👁️" label="Visibility" value={`${weather.current.visibility} km`} />
            <MetricCell icon="🌡️" label="Pressure" value={`${weather.current.pressure} hPa`} />
          </View>
        </GlassCard>

        {/* ── 24-Hour Forecast ────────────────────────────── */}
        <SectionHeader title="24-Hour Forecast" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastRow}
        >
          {weather.hourlyForecast.map((h, i) => (
            <View key={i} style={styles.forecastCard}>
              <Text style={styles.forecastHour}>{h.hour}</Text>
              <Text style={styles.forecastIcon}>{h.icon}</Text>
              <Text style={styles.forecastTemp}>{h.temp}°</Text>
              <View style={styles.rainDrop}>
                <Text style={{ fontSize: 8 }}>💧</Text>
                <Text style={styles.forecastRain}>{h.rainProbability}%</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── 5-Day Forecast ──────────────────────────────── */}
        <SectionHeader title="5-Day Outlook" />
        <GlassCard>
          {weather.dailyForecast.map((d, i) => (
            <View
              key={i}
              style={[
                styles.dailyRow,
                i < weather.dailyForecast.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
            >
              <View style={styles.dailyLeft}>
                <Text style={styles.dailyDay}>{d.day}</Text>
                <Text style={styles.dailyDate}>{d.date}</Text>
              </View>
              <Text style={styles.dailyIcon}>{d.icon}</Text>
              <View style={styles.dailyTemps}>
                <Text style={styles.dailyHigh}>{d.highTemp}°</Text>
                <Text style={styles.dailyLow}>{d.lowTemp}°</Text>
              </View>
              <View style={styles.dailyRain}>
                <Text style={{ fontSize: 9 }}>💧</Text>
                <Text style={styles.dailyRainPct}>{d.rainProbability}%</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* ── FEATURE 4: Smart Weather Alerts ─────────────── */}
        {weather.warnings.length > 0 && (
          <>
            <SectionHeader title="Smart Weather Alerts" subtitle="Based on current conditions" />
            {weather.warnings.map((w) => (
              <WeatherAlertCard key={w.id} warning={w} />
            ))}
          </>
        )}

        {/* ── FEATURE 2: Combined Risk Assessment ─────────── */}
        {risk && (
          <>
            <SectionHeader
              title="AI Risk Assessment"
              subtitle="Weather + disaster zones + road conditions"
            />
            <CombinedRiskCard risk={risk} />
          </>
        )}

        {/* ── FEATURE 3: Route Safety Quick Action ────────── */}
        <SectionHeader title="Route Safety" />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('route-safety')}
          style={styles.routeCard}
        >
          <View style={styles.routeCardInner}>
            <View style={styles.routeIconWrap}>
              <View style={styles.routeIconGlow} />
              <View style={styles.routeIcon}>
                <Text style={{ fontSize: 22 }}>🗺️</Text>
              </View>
            </View>
            <View style={styles.routeText}>
              <Text style={styles.routeTitle}>Check Route Safety</Text>
              <Text style={styles.routeSub}>
                Analyze weather, hazards & blocked roads along your route
              </Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* ── Disclaimer ──────────────────────────────────── */}
        {risk && (
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerIcon}>ℹ️</Text>
            <Text style={styles.disclaimerText}>{risk.disclaimer}</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const MetricCell: React.FC<{ icon: string; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <View style={mcStyles.cell}>
    <Text style={mcStyles.icon}>{icon}</Text>
    <Text style={mcStyles.value}>{value}</Text>
    <Text style={mcStyles.label}>{label}</Text>
  </View>
);
const mcStyles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginHorizontal: 3,
  },
  icon: { fontSize: 16, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  label: { fontSize: 10, color: colors.text.tertiary, fontWeight: '500' },
});

const WeatherAlertCard: React.FC<{ warning: WeatherWarning }> = ({ warning }) => {
  const sev = getSev(warning.severity);
  return (
    <View style={[wacStyles.card, { borderColor: sev.border, backgroundColor: sev.bg }]}>
      <View style={wacStyles.top}>
        <Text style={wacStyles.icon}>{warning.icon}</Text>
        <View style={wacStyles.info}>
          <View style={[wacStyles.pill, { backgroundColor: sev.border }]}>
            <Text style={[wacStyles.pillText, { color: sev.text }]}>
              {warning.severity.toUpperCase()}
            </Text>
          </View>
          <Text style={wacStyles.title}>{warning.title}</Text>
        </View>
      </View>
      <Text style={wacStyles.desc}>{warning.description}</Text>
      <View style={[wacStyles.actionRow, { borderTopColor: sev.border }]}>
        <Text style={wacStyles.actionIcon}>→</Text>
        <Text style={[wacStyles.actionText, { color: sev.text }]}>{warning.action}</Text>
      </View>
    </View>
  );
};
const wacStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  icon: { fontSize: 24, marginRight: 10, marginTop: 2 },
  info: { flex: 1 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  desc: { fontSize: 12, color: colors.text.secondary, lineHeight: 18, marginBottom: 10 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionIcon: { fontSize: 14, color: colors.text.tertiary, marginTop: 1 },
  actionText: { fontSize: 12, fontWeight: '600', lineHeight: 18, flex: 1 },
});

const CombinedRiskCard: React.FC<{ risk: CombinedRiskResult }> = ({ risk }) => {
  const sev = getSev(risk.level);
  const topFactors = risk.factors
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 4);

  return (
    <View style={[crcStyles.card, { borderColor: sev.border, borderLeftWidth: 3, borderLeftColor: sev.solid }]}>
      {/* Score + Level */}
      <View style={crcStyles.top}>
        <View style={[crcStyles.scoreCircle, { borderColor: sev.solid }]}>
          <Text style={[crcStyles.scoreNum, { color: sev.text }]}>{risk.overallScore}</Text>
          <Text style={crcStyles.scoreLbl}>RISK</Text>
        </View>
        <View style={crcStyles.info}>
          <View style={[crcStyles.levelPill, { backgroundColor: sev.bg }]}>
            <View style={[crcStyles.dot, { backgroundColor: sev.solid }]} />
            <Text style={[crcStyles.levelText, { color: sev.text }]}>{risk.label}</Text>
          </View>
          <Text style={crcStyles.desc}>{risk.description}</Text>
        </View>
      </View>

      {/* Risk Factors */}
      {topFactors.length > 0 && (
        <View style={crcStyles.factorsWrap}>
          <Text style={crcStyles.factorsTitle}>Risk Factors</Text>
          {topFactors.map((f, i) => {
            const fSev = getSev(f.severity);
            return (
              <View key={f.id} style={crcStyles.factorRow}>
                <View style={[crcStyles.factorDot, { backgroundColor: fSev.solid }]} />
                <View style={crcStyles.factorInfo}>
                  <Text style={crcStyles.factorLabel}>{f.label}</Text>
                  <Text style={crcStyles.factorDesc} numberOfLines={2}>{f.description}</Text>
                </View>
                <View style={[crcStyles.impactBadge, { borderColor: fSev.border }]}>
                  <Text style={[crcStyles.impactText, { color: fSev.text }]}>{f.impact}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recommendation */}
      <View style={[crcStyles.recRow, { borderTopColor: sev.border }]}>
        <Text style={crcStyles.recIcon}>🛡️</Text>
        <Text style={[crcStyles.recText, { color: sev.text }]}>{risk.recommendation}</Text>
      </View>
    </View>
  );
};
const crcStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.bg.card,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  scoreCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginRight: 14,
  },
  scoreNum: { fontSize: 26, fontWeight: '800', fontFamily: 'SpaceGrotesk-Bold' },
  scoreLbl: { fontSize: 9, color: colors.text.tertiary, fontWeight: '600', marginTop: -2 },
  info: { flex: 1 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  levelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  desc: { fontSize: 12, color: colors.text.secondary, lineHeight: 17 },
  factorsWrap: {
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border.subtle,
    marginBottom: 12,
  },
  factorsTitle: {
    fontSize: 11, fontWeight: '700', color: colors.text.tertiary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  factorRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 6,
  },
  factorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  factorInfo: { flex: 1 },
  factorLabel: { fontSize: 12, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  factorDesc: { fontSize: 11, color: colors.text.tertiary, lineHeight: 15 },
  impactBadge: {
    minWidth: 32, height: 24, borderRadius: 8,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  impactText: { fontSize: 11, fontWeight: '700' },
  recRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingTop: 12, borderTopWidth: 1,
  },
  recIcon: { fontSize: 16 },
  recText: { fontSize: 12, fontWeight: '600', lineHeight: 18, flex: 1 },
});

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: colors.text.secondary, marginTop: 12 },
  loadingSub: { fontSize: 11, color: colors.text.tertiary, marginTop: 4, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 6 },
  errorSub: { fontSize: 12, color: colors.text.secondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: colors.brand.primary, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: borderRadius.lg,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: colors.text.primary,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 12, color: colors.text.secondary, fontWeight: '500' },
  sourceBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1,
  },
  sourceText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Current weather
  weatherTop: { flexDirection: 'row', marginBottom: 14 },
  tempBlock: { alignItems: 'center', marginRight: 20 },
  tempIcon: { fontSize: 38, marginBottom: 4 },
  tempValue: {
    fontSize: 44, fontWeight: '800', color: colors.text.primary,
    fontFamily: 'SpaceGrotesk-Bold', letterSpacing: -2,
  },
  tempUnit: { fontSize: 10, color: colors.text.tertiary, marginTop: -4 },
  weatherInfo: { flex: 1, paddingTop: 6 },
  conditionLabel: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  feelsLike: { fontSize: 12, color: colors.text.secondary, marginBottom: 8 },
  rainPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(14,165,233,0.08)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.15)',
  },
  rainText: { fontSize: 12, fontWeight: '600', color: '#38BDF8' },
  metricsGrid: { flexDirection: 'row', gap: 6 },

  // Forecast
  forecastRow: { paddingHorizontal: 2, marginBottom: 20 },
  forecastCard: {
    width: 68, alignItems: 'center', paddingVertical: 12, marginHorizontal: 4,
    borderRadius: 12, backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  forecastHour: { fontSize: 10, color: colors.text.tertiary, fontWeight: '600', marginBottom: 6 },
  forecastIcon: { fontSize: 20, marginBottom: 4 },
  forecastTemp: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  rainDrop: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  forecastRain: { fontSize: 10, color: '#38BDF8', fontWeight: '600' },

  // Daily forecast
  dailyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  dailyLeft: { width: 70 },
  dailyDay: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  dailyDate: { fontSize: 10, color: colors.text.tertiary },
  dailyIcon: { fontSize: 18, marginHorizontal: 12 },
  dailyTemps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dailyHigh: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  dailyLow: { fontSize: 13, color: colors.text.tertiary },
  dailyRain: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dailyRainPct: { fontSize: 11, color: '#38BDF8', fontWeight: '600' },

  // Route safety card
  routeCard: { marginBottom: 16 },
  routeCardInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg.card, borderRadius: borderRadius.card,
    padding: 16, borderWidth: 1, borderColor: colors.border.subtle,
  },
  routeIconWrap: { marginRight: 14 },
  routeIconGlow: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(40,82,255,0.10)',
  },
  routeIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(40,82,255,0.10)', borderWidth: 1.5,
    borderColor: 'rgba(40,82,255,0.20)', alignItems: 'center', justifyContent: 'center',
  },
  routeText: { flex: 1 },
  routeTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 3 },
  routeSub: { fontSize: 11, color: colors.text.tertiary, lineHeight: 16 },
  routeArrow: { fontSize: 20, color: colors.brand.primaryLight, marginLeft: 8, fontWeight: '600' },

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
});
