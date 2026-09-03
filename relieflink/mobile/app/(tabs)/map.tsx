import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { colors } from '../../constants/theme';
import { mockAlerts } from '../../utils/sampleData';

const severityConfig: Record<string, { color: string; bg: string }> = {
  safe: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  low: { color: '#84CC16', bg: 'rgba(132,204,22,0.12)' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  high: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  critical: { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
};

const disasterIcons: Record<string, string> = {
  flood: '🌊',
  earthquake: '🫨',
  fire: '🔥',
  landslide: '⛰️',
  storm: '🌪️',
  extreme_rain: '🌧️',
};

type MapLayer = 'risk' | 'shelters' | 'teams' | 'sos';

export const MapScreen: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('risk');

  const layers: { id: MapLayer; label: string; icon: string; color: string }[] = [
    { id: 'risk', label: 'Risk Zones', icon: '🔴', color: '#EF4444' },
    { id: 'shelters', label: 'Shelters', icon: '🏠', color: '#22C55E' },
    { id: 'teams', label: 'Teams', icon: '🚑', color: '#3B82F6' },
    { id: 'sos', label: 'SOS Pins', icon: '🆘', color: '#F43F5E' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        {/* Dark map background */}
        <View style={styles.mapBg}>
          {/* Grid overlay */}
          <View style={styles.mapGrid} />

          {/* Pakistan silhouette placeholder */}
          <View style={styles.mapCenter}>
            <Text style={styles.mapPlaceholderText}>🗺️</Text>
            <Text style={styles.mapLabel}>Interactive Map</Text>
            <Text style={styles.mapSubLabel}>Islamabad Capital Territory</Text>
          </View>

          {/* Simulated risk zone overlays */}
          <View style={[styles.riskZone, styles.riskZone1]} />
          <View style={[styles.riskZone, styles.riskZone2]} />
          <View style={[styles.safeZone, styles.safeZone1]} />

          {/* Simulated shelter pins */}
          <View style={[styles.pin, styles.pin1]}>
            <Text style={{ fontSize: 14 }}>🏠</Text>
          </View>
          <View style={[styles.pin, styles.pin2]}>
            <Text style={{ fontSize: 14 }}>🏥</Text>
          </View>
          <View style={[styles.pin, styles.pin3]}>
            <Text style={{ fontSize: 14 }}>⛺</Text>
          </View>

          {/* User location pin */}
          <View style={styles.userPin}>
            <View style={styles.userPinRing} />
            <View style={styles.userPinDot} />
          </View>
        </View>

        {/* Layer toggle toolbar */}
        <View style={styles.layerToolbar}>
          {layers.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[
                styles.layerBtn,
                activeLayer === l.id && {
                  backgroundColor: l.color + '18',
                  borderColor: l.color + '35',
                },
              ]}
              onPress={() => setActiveLayer(l.id)}
            >
              <Text style={{ fontSize: 12 }}>{l.icon}</Text>
              <Text
                style={[
                  styles.layerBtnText,
                  activeLayer === l.id && { color: l.color },
                ]}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floating controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlBtn}>
            <Text style={{ fontSize: 16 }}>📍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlBtn}>
            <Text style={{ fontSize: 16 }}>➕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlBtn}>
            <Text style={{ fontSize: 16 }}>➖</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet: Active alerts */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Active Alerts Near You</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.alertScroll}
        >
          {mockAlerts.map((alert) => {
            const sev = severityConfig[alert.severity];
            return (
              <TouchableOpacity key={alert.id} style={styles.alertChip}>
                <View style={[styles.alertChipDot, { backgroundColor: sev.color }]} />
                <Text style={styles.alertChipEmoji}>
                  {disasterIcons[alert.disasterType]}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertChipTitle} numberOfLines={1}>
                    {alert.title.split('—')[0].trim()}
                  </Text>
                  <Text style={styles.alertChipMeta}>
                    {alert.distance} • {alert.time}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>High Risk</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Safe Zone</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBg: {
    flex: 1,
    backgroundColor: '#080D18',
    overflow: 'hidden',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    borderColor: 'rgba(148,163,184,0.04)',
    // Can't do backgroundImage in RN — grid is simulated
  },
  mapCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  mapSubLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },

  // Risk zones
  riskZone: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.15,
  },
  riskZone1: {
    width: 180,
    height: 180,
    backgroundColor: '#EF4444',
    top: '20%',
    left: '10%',
  },
  riskZone2: {
    width: 120,
    height: 120,
    backgroundColor: '#F59E0B',
    top: '50%',
    right: '15%',
  },
  safeZone: {
    position: 'absolute',
    borderRadius: 80,
    opacity: 0.12,
  },
  safeZone1: {
    width: 150,
    height: 150,
    backgroundColor: '#22C55E',
    bottom: '25%',
    left: '30%',
  },

  // Pins
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin1: { top: '30%', left: '25%' },
  pin2: { top: '45%', right: '30%' },
  pin3: { bottom: '35%', left: '50%' },

  // User location
  userPin: {
    position: 'absolute',
    top: '48%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPinRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  userPinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },

  // Layer toolbar
  layerToolbar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  layerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.08)',
  },
  layerBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
  },

  // Map controls
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 8,
  },
  mapControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom sheet
  bottomSheet: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  alertScroll: {
    gap: 10,
    paddingBottom: 12,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: 12,
    width: 240,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  alertChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertChipEmoji: {
    fontSize: 16,
  },
  alertChipTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  alertChipMeta: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});
