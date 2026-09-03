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
} from 'react-native';
import { colors } from '../../constants/theme';
import { mockShelters, mockHospitals } from '../../utils/sampleData';
import { ShelterCard, SectionHeader } from '../../components/shared/SharedComponents';

type PlaceFilter = 'all' | 'shelter' | 'hospital' | 'mosque' | 'school';

export const FindSafePlaceScreen: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const [filter, setFilter] = useState<PlaceFilter>('all');
  const [search, setSearch] = useState('');

  const filters: { id: PlaceFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🏠' },
    { id: 'shelter', label: 'Shelters', icon: '⛺' },
    { id: 'hospital', label: 'Hospitals', icon: '🏥' },
    { id: 'mosque', label: 'Mosques', icon: '🕌' },
    { id: 'school', label: 'Schools', icon: '🏫' },
  ];

  const filteredShelters =
    filter === 'all' || filter === 'shelter'
      ? mockShelters.filter(
          (s) => filter === 'all' || s.type === filter
        )
      : [];

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
        <Text style={styles.title}>Find Safe Place</Text>
        <Text style={styles.subtitle}>
          Nearby shelters and safe zones in your area
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or area..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={{ fontSize: 12 }}>{f.icon}</Text>
            <Text
              style={[
                styles.filterChipText,
                filter === f.id && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={`Shelters (${mockShelters.length})`} />
        {mockShelters.map((s) => (
          <ShelterCard key={s.id} {...s} />
        ))}

        <SectionHeader title={`Hospitals (${mockHospitals.length})`} />
        {mockHospitals.map((h) => (
          <TouchableOpacity
            key={h.id}
            style={styles.hospitalCard}
            activeOpacity={0.7}
          >
            <View style={styles.hospitalIcon}>
              <Text style={{ fontSize: 20 }}>🏥</Text>
            </View>
            <View style={styles.hospitalInfo}>
              <Text style={styles.hospitalName}>{h.name}</Text>
              <Text style={styles.hospitalAddress}>{h.address}</Text>
            </View>
            <View style={styles.hospitalMeta}>
              <Text style={styles.hospitalDistance}>{h.distance}</Text>
              <Text style={styles.hospitalTime}>{h.travelTime}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
    marginBottom: 12,
  },
  backText: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
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
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  filterChipActive: {
    backgroundColor: 'rgba(40,82,255,0.12)',
    borderColor: 'rgba(40,82,255,0.25)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  filterChipTextActive: {
    color: '#7E98FF',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Hospital card
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
  hospitalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalInfo: { flex: 1 },
  hospitalName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  hospitalAddress: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  hospitalMeta: {
    alignItems: 'flex-end',
  },
  hospitalDistance: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  hospitalTime: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
});
