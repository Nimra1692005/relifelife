import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { colors } from '../../constants/theme';

interface PermissionSetupProps {
  onComplete: () => void;
}

interface PermissionItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  required: boolean;
  granted: boolean;
}

export const PermissionSetup: React.FC<PermissionSetupProps> = ({
  onComplete,
}) => {
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'location',
      icon: '📍',
      title: 'Location Access',
      description: 'Required to show nearby alerts, shelters, and safe routes in your area.',
      required: true,
      granted: false,
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Push Notifications',
      description: 'Critical for receiving real-time disaster alerts and SOS updates.',
      required: true,
      granted: false,
    },
    {
      id: 'contacts',
      icon: '👥',
      title: 'Emergency Contacts',
      description: 'Share your SOS location with trusted contacts during emergencies.',
      required: false,
      granted: false,
    },
    {
      id: 'phone',
      icon: '📱',
      title: 'Phone & SMS',
      description: 'Enable SMS-based SOS when internet is unavailable.',
      required: false,
      granted: false,
    },
  ]);

  const handleGrant = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, granted: true } : p))
    );
  };

  const allRequired = permissions
    .filter((p) => p.required)
    .every((p) => p.granted);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 32 }}>🔐</Text>
          </View>
          <Text style={styles.title}>Permission Setup</Text>
          <Text style={styles.subtitle}>
            ReliefLink needs a few permissions to keep you safe during emergencies.
            You can change these anytime in settings.
          </Text>
        </View>

        {/* Permission cards */}
        <View style={styles.permissionList}>
          {permissions.map((perm) => (
            <View
              key={perm.id}
              style={[
                styles.permCard,
                perm.granted && styles.permCardGranted,
              ]}
            >
              <View style={styles.permRow}>
                <View style={styles.permIcon}>
                  <Text style={{ fontSize: 22 }}>{perm.icon}</Text>
                </View>
                <View style={styles.permInfo}>
                  <View style={styles.permTitleRow}>
                    <Text style={styles.permTitle}>{perm.title}</Text>
                    {perm.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.permDescription}>
                    {perm.description}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.permButton,
                  perm.granted && styles.permButtonGranted,
                ]}
                onPress={() => handleGrant(perm.id)}
                disabled={perm.granted}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.permButtonText,
                    perm.granted && styles.permButtonTextGranted,
                  ]}
                >
                  {perm.granted ? '✓ Granted' : 'Allow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Your data stays on your device and is only shared with rescue services when you send an SOS.
            We never sell or share your personal information.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            !allRequired && styles.continueBtnDisabled,
          ]}
          onPress={onComplete}
          disabled={!allRequired}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.continueBtnText,
              !allRequired && styles.continueBtnTextDisabled,
            ]}
          >
            {allRequired ? 'Continue to ReliefLink' : 'Grant Required Permissions'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(40, 82, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(40, 82, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  permissionList: {
    gap: 12,
  },
  permCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  permCardGranted: {
    borderColor: 'rgba(34, 197, 94, 0.2)',
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  permInfo: {
    flex: 1,
  },
  permTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  requiredText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F87171',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permDescription: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  permButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.brand.primary + '15',
    borderWidth: 1,
    borderColor: colors.brand.primary + '25',
    alignItems: 'center',
  },
  permButtonGranted: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  permButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.primaryLight,
  },
  permButtonTextGranted: {
    color: '#4ADE80',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  privacyIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: colors.bg.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  continueBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2852FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  continueBtnDisabled: {
    backgroundColor: colors.bg.card,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueBtnTextDisabled: {
    color: colors.text.tertiary,
  },
});
