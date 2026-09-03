import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors } from '../../constants/theme';
import { mockUser, mockLocation } from '../../utils/sampleData';

export const ProfileScreen: React.FC = () => {
  const initials = mockUser.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Personal Information', action: 'edit' },
        { icon: '📞', label: 'Emergency Contacts', badge: '1 saved' },
        { icon: '🩸', label: 'Medical Info', badge: mockUser.blood_group },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🌐', label: 'Language', badge: 'English' },
        { icon: '🔔', label: 'Notifications', badge: 'On' },
        { icon: '🌙', label: 'Theme', badge: 'Dark' },
        { icon: '📍', label: 'Location Settings' },
      ],
    },
    {
      title: 'Safety',
      items: [
        { icon: '📋', label: 'Emergency Plan' },
        { icon: '🗺️', label: 'Saved Routes' },
        { icon: '📱', label: 'Offline Mode' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'ℹ️', label: 'About ReliefLink' },
        { icon: '📄', label: 'Terms & Privacy' },
        { icon: '⭐', label: 'Rate the App' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{mockUser.full_name}</Text>
          <Text style={styles.userPhone}>{mockUser.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Citizen</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Safe</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>O+</Text>
            <Text style={styles.statLabel}>Blood</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mockLocation.city}</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Menu sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[
                    styles.menuItem,
                    ii < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>ReliefLink v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(40,82,255,0.1)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(40,82,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(40,82,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.brand.primaryLight,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(40,82,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.2)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E98FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },

  // Menu
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  menuIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  menuBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.text.tertiary,
    fontWeight: '300',
  },

  // Logout
  logoutBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F87171',
  },
  versionText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
  },
});
