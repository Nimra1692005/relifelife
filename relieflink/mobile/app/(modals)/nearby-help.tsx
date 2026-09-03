import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Linking,
} from 'react-native';
import { colors } from '../../constants/theme';
import {
  mockEmergencyContacts,
  mockHospitals,
  mockShelters,
} from '../../utils/sampleData';

type HelpTab = 'contacts' | 'hospitals' | 'shelters' | 'rescue';

interface RescueService {
  id: string;
  name: string;
  type: string;
  phone: string;
  distance: string;
  available: boolean;
  eta: string;
  icon: string;
}

const mockRescueServices: RescueService[] = [
  {
    id: 'r_001',
    name: 'Rescue 1122 — Islamabad',
    type: 'Ambulance',
    phone: '1122',
    distance: '1.5 km',
    available: true,
    eta: '6 min',
    icon: '🚑',
  },
  {
    id: 'r_002',
    name: 'Edhi Ambulance Service',
    type: 'Ambulance',
    phone: '115',
    distance: '2.3 km',
    available: true,
    eta: '9 min',
    icon: '🚑',
  },
  {
    id: 'r_003',
    name: 'NDMA Rescue Team Alpha',
    type: 'Rescue Team',
    phone: '111-157-157',
    distance: '4.1 km',
    available: true,
    eta: '14 min',
    icon: '🚒',
  },
  {
    id: 'r_004',
    name: 'Civil Defence Unit 7',
    type: 'Rescue Team',
    phone: '112',
    distance: '5.8 km',
    available: false,
    eta: '22 min',
    icon: '🛡️',
  },
  {
    id: 'r_005',
    name: 'Pakistan Red Crescent',
    type: 'Medical Aid',
    phone: '+92 51 9204020',
    distance: '3.6 km',
    available: true,
    eta: '12 min',
    icon: '⛑️',
  },
];

const contactIcons: Record<string, string> = {
  ambulance: '🚑',
  police: '👮',
  fire: '🚒',
  aid: '⛑️',
  government: '🏛️',
  person: '👤',
};

const contactAccents: Record<string, string> = {
  ambulance: '#EF4444',
  police: '#3B82F6',
  fire: '#F97316',
  aid: '#22C55E',
  government: '#8B5CF6',
  person: '#06B6D4',
};

export const NearbyHelpScreen: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('contacts');
  const [search, setSearch] = useState('');

  const tabs: { id: HelpTab; label: string; icon: string }[] = [
    { id: 'contacts', label: 'Emergency', icon: '📞' },
    { id: 'hospitals', label: 'Hospitals', icon: '🏥' },
    { id: 'shelters', label: 'Shelters', icon: '⛺' },
    { id: 'rescue', label: 'Rescue', icon: '🚑' },
  ];

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>Nearby Help</Text>
          <Text style={styles.subtitle}>
            Emergency services and support near you
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text style={{ fontSize: 13 }}>{t.icon}</Text>
            <Text
              style={[
                styles.tabText,
                activeTab === t.id && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
            {activeTab === t.id && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Contacts Tab */}
        {activeTab === 'contacts' && (
          <View>
            {/* Quick dial banner */}
            <View style={styles.quickDialBanner}>
              <View style={styles.quickDialIcon}>
                <Text style={{ fontSize: 24 }}>🆘</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickDialTitle}>
                  Universal Emergency: 1122
                </Text>
                <Text style={styles.quickDialSubtitle}>
                  Tap to call — works without network
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quickDialBtn}
                onPress={() => handleCall('1122')}
              >
                <Text style={styles.quickDialBtnText}>Call Now</Text>
              </TouchableOpacity>
            </View>

            {/* Contact grid */}
            <View style={styles.contactGrid}>
              {mockEmergencyContacts.map((contact, i) => {
                const accent =
                  contactAccents[contact.icon] || colors.brand.primary;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.contactCard}
                    activeOpacity={0.7}
                    onPress={() => handleCall(contact.number)}
                  >
                    <View
                      style={[
                        styles.contactIconWrap,
                        { backgroundColor: accent + '12', borderColor: accent + '20' },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>
                        {contactIcons[contact.icon] || '📞'}
                      </Text>
                    </View>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {contact.name}
                    </Text>
                    <Text style={styles.contactNumber}>{contact.number}</Text>
                    <View
                      style={[
                        styles.contactCallBtn,
                        { backgroundColor: accent + '15', borderColor: accent + '25' },
                      ]}
                    >
                      <Text style={[styles.contactCallText, { color: accent }]}>
                        📞 Call
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Hospitals Tab */}
        {activeTab === 'hospitals' && (
          <View>
            {mockHospitals.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={styles.hospitalCard}
                activeOpacity={0.7}
              >
                <View style={styles.hospitalLeft}>
                  <View style={styles.hospitalIconWrap}>
                    <Text style={{ fontSize: 22 }}>🏥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hospitalName}>{h.name}</Text>
                    <Text style={styles.hospitalAddress}>{h.address}</Text>
                    <View style={styles.hospitalMeta}>
                      <Text style={styles.hospitalDist}>📍 {h.distance}</Text>
                      <Text style={styles.hospitalTime}>🕐 {h.travelTime}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.hospitalRight}>
                  <View
                    style={[
                      styles.availBadge,
                      h.available
                        ? styles.availBadgeGreen
                        : styles.availBadgeRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availText,
                        {
                          color: h.available ? '#4ADE80' : '#F87171',
                        },
                      ]}
                    >
                      {h.available ? 'Open' : 'Full'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callMiniBtn}
                    onPress={() => handleCall(h.emergencyPhone)}
                  >
                    <Text style={styles.callMiniText}>📞 Call</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Shelters Tab */}
        {activeTab === 'shelters' && (
          <View>
            {mockShelters.map((s) => {
              const spots = s.capacity - s.currentOccupancy;
              const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.shelterRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.shelterRowTop}>
                    <View style={styles.shelterRowIcon}>
                      <Text style={{ fontSize: 18 }}>
                        {s.type === 'mosque'
                          ? '🕌'
                          : s.type === 'school'
                            ? '🏫'
                            : s.type === 'relief_camp'
                              ? '⛺'
                              : '🏠'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shelterRowName}>{s.name}</Text>
                      <Text style={styles.shelterRowAddr}>{s.address}</Text>
                    </View>
                    {s.verified && (
                      <View style={styles.verBadge}>
                        <Text style={styles.verText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.shelterRowStats}>
                    <View style={styles.shelterStat}>
                      <Text style={styles.shelterStatVal}>{s.distance}</Text>
                      <Text style={styles.shelterStatLbl}>Distance</Text>
                    </View>
                    <View style={styles.shelterStatSep} />
                    <View style={styles.shelterStat}>
                      <Text style={styles.shelterStatVal}>{s.travelTime}</Text>
                      <Text style={styles.shelterStatLbl}>Travel</Text>
                    </View>
                    <View style={styles.shelterStatSep} />
                    <View style={styles.shelterStat}>
                      <Text
                        style={[
                          styles.shelterStatVal,
                          {
                            color:
                              spots > 200
                                ? '#4ADE80'
                                : spots > 100
                                  ? '#FBBF24'
                                  : '#F87171',
                          },
                        ]}
                      >
                        {spots}
                      </Text>
                      <Text style={styles.shelterStatLbl}>Spots</Text>
                    </View>
                  </View>
                  <View style={styles.capBar}>
                    <View style={styles.capBarBg}>
                      <View
                        style={[
                          styles.capBarFill,
                          {
                            width: `${pct}%`,
                            backgroundColor:
                              pct > 80
                                ? '#EF4444'
                                : pct > 60
                                  ? '#F59E0B'
                                  : '#22C55E',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.capLabel}>
                      {pct}% occupied
                    </Text>
                  </View>
                  <View style={styles.shelterRowActions}>
                    <TouchableOpacity style={styles.directionBtn}>
                      <Text style={styles.directionBtnText}>
                        🧭 Get Directions
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callShelterBtn}>
                      <Text style={styles.callShelterBtnText}>📞 Call</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Rescue Services Tab */}
        {activeTab === 'rescue' && (
          <View>
            {mockRescueServices.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.rescueCard}
                activeOpacity={0.7}
              >
                <View style={styles.rescueTop}>
                  <View
                    style={[
                      styles.rescueIcon,
                      r.available
                        ? { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.15)' }
                        : { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.1)' },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rescueName}>{r.name}</Text>
                    <Text style={styles.rescueType}>{r.type}</Text>
                  </View>
                  <View
                    style={[
                      styles.rescueStatus,
                      r.available
                        ? styles.rescueStatusActive
                        : styles.rescueStatusBusy,
                    ]}
                  >
                    <View
                      style={[
                        styles.rescueDot,
                        r.available
                          ? { backgroundColor: '#22C55E' }
                          : { backgroundColor: '#EF4444' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.rescueStatusText,
                        { color: r.available ? '#4ADE80' : '#F87171' },
                      ]}
                    >
                      {r.available ? 'Available' : 'Busy'}
                    </Text>
                  </View>
                </View>
                <View style={styles.rescueStats}>
                  <View style={styles.rescueStat}>
                    <Text style={styles.rescueStatVal}>📍 {r.distance}</Text>
                  </View>
                  <View style={styles.rescueStat}>
                    <Text style={styles.rescueStatVal}>🕐 ETA {r.eta}</Text>
                  </View>
                  <View style={styles.rescueStat}>
                    <Text style={styles.rescueStatVal}>📞 {r.phone}</Text>
                  </View>
                </View>
                <View style={styles.rescueActions}>
                  <TouchableOpacity
                    style={[
                      styles.rescueCallBtn,
                      !r.available && styles.rescueCallBtnDisabled,
                    ]}
                    onPress={() => handleCall(r.phone)}
                    disabled={!r.available}
                  >
                    <Text style={styles.rescueCallBtnText}>
                      {r.available ? '📞 Call Now' : 'Unavailable'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rescueDirBtn}>
                    <Text style={styles.rescueDirBtnText}>🧭 Directions</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
  },

  // Tabs
  tabRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(40,82,255,0.12)',
    borderColor: 'rgba(40,82,255,0.25)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: '#7E98FF',
  },
  tabDot: {
    position: 'absolute',
    bottom: -1,
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Quick Dial Banner
  quickDialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
    marginBottom: 20,
    gap: 12,
  },
  quickDialIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  quickDialSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  quickDialBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  quickDialBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Contact Grid
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    width: '47%',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  contactIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: 10,
  },
  contactCallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactCallText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Hospital cards
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  hospitalLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  hospitalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  hospitalAddress: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: 6,
  },
  hospitalMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  hospitalDist: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  hospitalTime: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  hospitalRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availBadgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
  },
  availBadgeRed: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  availText: {
    fontSize: 10,
    fontWeight: '700',
  },
  callMiniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(40,82,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.15)',
  },
  callMiniText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E98FF',
  },

  // Shelter rows
  shelterRow: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  shelterRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shelterRowIcon: {
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
  shelterRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  shelterRowAddr: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  verBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
  },
  shelterRowStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  shelterStat: {
    flex: 1,
    alignItems: 'center',
  },
  shelterStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  shelterStatLbl: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shelterStatSep: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },
  capBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  capBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  capBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  capLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    width: 85,
    textAlign: 'right',
  },
  shelterRowActions: {
    flexDirection: 'row',
    gap: 10,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(40,82,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.15)',
    alignItems: 'center',
  },
  directionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E98FF',
  },
  callShelterBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
  },
  callShelterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ADE80',
  },

  // Rescue cards
  rescueCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  rescueTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  rescueIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rescueName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  rescueType: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  rescueStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rescueStatusActive: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
  },
  rescueStatusBusy: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.1)',
  },
  rescueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rescueStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rescueStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 16,
  },
  rescueStat: {},
  rescueStatVal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  rescueActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rescueCallBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
  },
  rescueCallBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    opacity: 0.5,
  },
  rescueCallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rescueDirBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  rescueDirBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
