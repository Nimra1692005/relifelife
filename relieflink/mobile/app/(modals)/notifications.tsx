import React, { useState } from 'react';
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
import { mockNotifications } from '../../utils/sampleData';

type NotifFilter = 'all' | 'unread' | 'alerts' | 'system';

const notifTypeConfig: Record<
  string,
  { icon: string; accent: string; label: string }
> = {
  alert: { icon: '🚨', accent: '#EF4444', label: 'Alert' },
  system: { icon: 'ℹ️', accent: '#3B82F6', label: 'System' },
  sos_update: { icon: '🆘', accent: '#F43F5E', label: 'SOS Update' },
  shelter: { icon: '⛺', accent: '#22C55E', label: 'Shelter' },
  weather: { icon: '🌧️', accent: '#6366F1', label: 'Weather' },
};

export const NotificationsScreen: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const [filter, setFilter] = useState<NotifFilter>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filters: { id: NotifFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'alerts', label: 'Alerts' },
    { id: 'system', label: 'System' },
  ];

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'alert';
    if (filter === 'system') return n.type === 'system' || n.type === 'sos_update';
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
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
            <Text
              style={[
                styles.filterChipText,
                filter === f.id && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
            {f.count !== undefined && (
              <View
                style={[
                  styles.filterCount,
                  filter === f.id
                    ? styles.filterCountActive
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    filter === f.id && styles.filterCountTextActive,
                  ]}
                >
                  {f.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Unread section header */}
        {filter === 'all' && unreadCount > 0 && (
          <View style={styles.sectionDivider}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabel}>New</Text>
            <View style={styles.sectionLine} />
          </View>
        )}

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You'll be notified about alerts, safety updates, and SOS
              responses here.
            </Text>
          </View>
        ) : (
          filtered.map((n, idx) => {
            const cfg = notifTypeConfig[n.type] || notifTypeConfig.system;
            const showOlderDivider =
              filter === 'all' && idx === unreadCount && unreadCount > 0;

            return (
              <React.Fragment key={n.id}>
                {showOlderDivider && (
                  <View style={styles.sectionDivider}>
                    <Text style={styles.sectionLabel}>Earlier</Text>
                    <View style={styles.sectionLine} />
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.notifCard,
                    !n.read && styles.notifCardUnread,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => markAsRead(n.id)}
                >
                  {/* Left accent bar */}
                  <View
                    style={[
                      styles.notifAccent,
                      { backgroundColor: cfg.accent },
                    ]}
                  />

                  {/* Icon */}
                  <View
                    style={[
                      styles.notifIcon,
                      {
                        backgroundColor: cfg.accent + '12',
                        borderColor: cfg.accent + '20',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.notifContent}>
                    <View style={styles.notifTopRow}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {n.title}
                      </Text>
                      {!n.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <View style={styles.notifBottom}>
                      <View
                        style={[
                          styles.notifTypePill,
                          { backgroundColor: cfg.accent + '12', borderColor: cfg.accent + '18' },
                        ]}
                      >
                        <Text
                          style={[styles.notifTypeText, { color: cfg.accent }]}
                        >
                          {cfg.label}
                        </Text>
                      </View>
                      <Text style={styles.notifTime}>{n.time}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(40,82,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.15)',
    marginTop: 4,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E98FF',
  },

  // Filters
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
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
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountActive: {
    backgroundColor: 'rgba(40,82,255,0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  filterCountTextActive: {
    color: '#7E98FF',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Section dividers
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // Notification card
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  notifCardUnread: {
    backgroundColor: '#0F1A30',
    borderColor: 'rgba(40,82,255,0.12)',
  },
  notifAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
    marginLeft: 6,
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    marginLeft: 8,
  },
  notifBody: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  notifBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  notifTypeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notifTime: {
    fontSize: 10,
    color: colors.text.tertiary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
