/**
 * ReliefLink Mobile — Admin Dashboard
 * Purple-themed: Overview stats, Recent Requests table, Live Disaster Map, Quick Actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { light, radius, statusColor } from '../../constants/lightTheme';
import { getAdminOverview, AdminOverview } from '../../services/api';
import { AuthUser } from '../../services/authContext';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'requests' | 'volunteers' | 'more';

export const AdminDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAdminOverview();
      setData(res.data);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const severityColor = (s: string) => {
    if (s === 'critical') return light.severity.critical;
    if (s === 'high') return light.severity.high;
    if (s === 'medium') return light.severity.medium;
    return light.severity.low;
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}><Text style={{ fontSize: 18 }}>⚙️</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Admin Dashboard</Text>
          <Text style={s.headerGreet}>Welcome, {user.full_name || 'Admin'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {tab === 'dashboard' && (
          <>
            {/* Stat Cards */}
            <View style={s.statsRow}>
              {[
                { label: 'Total Requests', value: data?.total_requests ?? '-', delta: data?.deltas?.total_requests },
                { label: 'Active Volunteers', value: data?.active_volunteers ?? '-', delta: data?.deltas?.active_volunteers },
                { label: 'Resolved', value: data?.resolved ?? '-', delta: data?.deltas?.resolved },
                { label: 'Pending', value: data?.pending ?? '-', delta: data?.deltas?.pending },
              ].map((st) => (
                <View key={st.label} style={s.statCard}>
                  <Text style={s.statValue}>{st.value}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                  {st.delta !== undefined && (
                    <Text style={[s.statDelta, { color: st.delta >= 0 ? '#059669' : '#DC2626' }]}>
                      {st.delta >= 0 ? '+' : ''}{st.delta}%
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Recent Requests */}
            <Text style={s.sectionTitle}>Recent Requests</Text>
            <View style={s.table}>
              <View style={s.tableHead}>
                {['ID', 'Category', 'Location', 'Status'].map((h) => <Text key={h} style={s.tableHeadText}>{h}</Text>)}
              </View>
              {(data?.recent_requests || []).map((r) => {
                const badge = statusColor(r.status);
                return (
                  <View key={r.id} style={s.tableRow}>
                    <Text style={s.tableCell}>{r.id}</Text>
                    <Text style={s.tableCell}>{r.category}</Text>
                    <Text style={s.tableCell}>{r.location || '-'}</Text>
                    <View style={[s.badge, { backgroundColor: badge.bg }]}><Text style={[s.badgeText, { color: badge.text }]}>{r.status}</Text></View>
                  </View>
                );
              })}
            </View>

            {/* Live Disaster Map */}
            <Text style={s.sectionTitle}>Live Disaster Map</Text>
            <View style={s.mapPanel}>
              <View style={s.mapBg}>
                {(data?.map_markers || []).map((m, i) => {
                  // Position markers by index (stylized, no native map)
                  const top = 15 + (i * 22) % 70;
                  const left = 10 + (i * 25) % 75;
                  return (
                    <View key={m.id} style={[s.marker, { top: `${top}%`, left: `${left}%`, backgroundColor: severityColor(m.severity) }]}>
                      <Text style={s.markerDot}>●</Text>
                    </View>
                  );
                })}
                <View style={s.mapLegend}>
                  {[['Critical', light.severity.critical], ['High', light.severity.high], ['Medium', light.severity.medium], ['Low', light.severity.low]].map(([l, c]) => (
                    <View key={l} style={s.legendItem}><View style={[s.legendDot, { backgroundColor: c }]} /><Text style={s.legendText}>{l}</Text></View>
                  ))}
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.actionsGrid}>
              {['Add Volunteer', 'Manage Resources', 'Generate Report', 'Send Alert'].map((a) => (
                <TouchableOpacity key={a} style={s.actionBtn} onPress={() => Alert.alert(a, 'Feature available in full admin panel.')}>
                  <Text style={s.actionBtnText}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {tab === 'requests' && (
          <View>
            <Text style={s.sectionTitle}>Manage Requests</Text>
            <Text style={s.muted}>Full request management available in admin web panel.</Text>
          </View>
        )}

        {tab === 'volunteers' && (
          <View>
            <Text style={s.sectionTitle}>Volunteers</Text>
            <Text style={s.muted}>Active volunteers: {data?.active_volunteers ?? '-'}</Text>
          </View>
        )}

        {tab === 'more' && (
          <View>
            <Text style={s.sectionTitle}>Settings & More</Text>
            {['Reports & Analytics', 'Alerts & Notifications', 'Resources', 'Settings'].map((m) => (
              <TouchableOpacity key={m} style={s.moreRow}><Text style={s.moreText}>{m}</Text><Text style={s.moreArrow}>›</Text></TouchableOpacity>
            ))}
            <TouchableOpacity style={s.logoutBtn} onPress={onLogout}><Text style={s.logoutText}>Logout</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom tabs */}
      <View style={s.bottomBar}>
        {(['dashboard', 'requests', 'volunteers', 'more'] as AdminTab[]).map((t) => (
          <TouchableOpacity key={t} style={s.tabBtn} onPress={() => setTab(t)}>
            <Text style={[s.tabLabel, tab === t && { color: light.admin.base, fontWeight: '700' }]}>
              {t === 'dashboard' ? '📊' : t === 'requests' ? '📋' : t === 'volunteers' ? '👥' : '⚙️'}\n{t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: light.surface, borderBottomWidth: 1, borderBottomColor: light.border },
  headerIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: light.admin.soft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: light.admin.base },
  headerGreet: { fontSize: 12, color: light.text.secondary },
  body: { padding: 16 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '47%', backgroundColor: light.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: light.border },
  statValue: { fontSize: 24, fontWeight: '800', color: light.admin.base },
  statLabel: { fontSize: 11, color: light.text.secondary, marginTop: 2 },
  statDelta: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: light.text.primary, marginBottom: 10, marginTop: 8 },
  table: { backgroundColor: light.surface, borderRadius: radius.md, borderWidth: 1, borderColor: light.border, overflow: 'hidden', marginBottom: 20 },
  tableHead: { flexDirection: 'row', backgroundColor: light.surfaceAlt, paddingVertical: 8, paddingHorizontal: 10 },
  tableHeadText: { flex: 1, fontSize: 10, fontWeight: '700', color: light.text.secondary },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: light.border },
  tableCell: { flex: 1, fontSize: 11, color: light.text.primary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 9, fontWeight: '700' },
  mapPanel: { height: 180, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: light.border },
  mapBg: { flex: 1, backgroundColor: '#E8F5E9' },
  marker: { position: 'absolute', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  markerDot: { fontSize: 10, color: '#fff' },
  mapLegend: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: radius.sm, padding: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 9, color: light.text.secondary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: '45%', backgroundColor: light.admin.soft, borderRadius: radius.md, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#DDD6FE' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: light.admin.text },
  muted: { color: light.text.muted, fontSize: 13 },
  moreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: light.surface, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: light.border, marginBottom: 8 },
  moreText: { fontSize: 14, color: light.text.primary, fontWeight: '500' },
  moreArrow: { fontSize: 18, color: light.text.muted },
  logoutBtn: { marginTop: 20, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  logoutText: { color: '#DC2626', fontWeight: '700' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: light.surface, borderTopWidth: 1, borderTopColor: light.border, paddingVertical: 10 },
  tabBtn: { alignItems: 'center' },
  tabLabel: { fontSize: 11, color: light.text.muted, textAlign: 'center', lineHeight: 16 },
});

export default AdminDashboard;
