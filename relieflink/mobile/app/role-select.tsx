/**
 * ReliefLink Mobile — Role Selection Screen
 * User picks Help / Volunteer / Admin (mockup screen 2)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { light, radius } from '../constants/lightTheme';
import { UserRole } from '../services/api';

interface Props {
  onSelect: (role: UserRole) => void;
  onBack: () => void;
}

const ROLES: Array<{
  id: UserRole;
  icon: string;
  title: string;
  subtitle: string;
  accent: string;
  soft: string;
}> = [
  {
    id: 'help',
    icon: '🆘',
    title: 'Help',
    subtitle: 'I need assistance / report an emergency',
    accent: light.help.base,
    soft: light.help.soft,
  },
  {
    id: 'volunteer',
    icon: '🙋',
    title: 'Volunteer',
    subtitle: 'I want to help / join response teams',
    accent: light.volunteer.base,
    soft: light.volunteer.soft,
  },
  {
    id: 'admin',
    icon: '⚙️',
    title: 'Admin',
    subtitle: 'Manage requests, volunteers & resources',
    accent: light.admin.base,
    soft: light.admin.soft,
  },
];

export const RoleSelectScreen: React.FC<Props> = ({ onSelect }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Select how you want to help.</Text>
      </View>

      <View style={styles.roles}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.card, { borderLeftColor: r.accent }]}
            activeOpacity={0.7}
            onPress={() => onSelect(r.id)}
          >
            <View style={[styles.iconBox, { backgroundColor: r.soft }]}>
              <Text style={styles.icon}>{r.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: r.accent }]}>{r.title}</Text>
              <Text style={styles.cardSub}>{r.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>Already have an account? Sign In</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.bg, padding: 24 },
  header: { marginTop: 32, marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: light.text.primary },
  subtitle: { fontSize: 14, color: light.text.secondary, marginTop: 4 },
  roles: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: light.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 22 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, color: light.text.secondary, marginTop: 2 },
  footer: {
    textAlign: 'center',
    color: light.text.muted,
    fontSize: 13,
    marginTop: 40,
  },
});

export default RoleSelectScreen;
