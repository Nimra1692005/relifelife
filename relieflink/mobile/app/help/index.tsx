/**
 * ReliefLink Mobile — Help Dashboard (Affected Person)
 * Green-themed with 6 quick tiles + bottom tab navigation.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert,
} from 'react-native';
import { light, radius, statusColor } from '../../constants/lightTheme';
import { getMyRequests, HelpRequest } from '../../services/api';
import { AuthUser } from '../../services/authContext';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

type HelpTab = 'home' | 'requests' | 'services' | 'profile';

const TILES = [
  { id: 'request', icon: '🆘', label: 'Request Help' },
  { id: 'myrequests', icon: '📋', label: 'My Requests' },
  { id: 'contacts', icon: '📞', label: 'Emergency Contacts' },
  { id: 'nearby', icon: '📍', label: 'Nearby Help' },
  { id: 'flood', icon: '🌊', label: 'Flood Predictor' },
  { id: 'alerts', icon: '🔔', label: 'Notifications' },
];

export const HelpDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<HelpTab>('home');
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loadingReq, setLoadingReq] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoadingReq(true);
    try {
      const res = await getMyRequests(user.id);
      setRequests(res.data || []);
    } catch {
      // silent — may be offline
    } finally {
      setLoadingReq(false);
    }
  }, [user.id]);

  const handleTile = (id: string) => {
    if (id === 'myrequests') { setTab('requests'); loadRequests(); }
    else if (id === 'request') { Alert.alert('Request Help', 'Select a category on the Home tab to submit.'); }
    else if (id === 'contacts') { Alert.alert('Emergency Services', 'Rescue: 1122\nPolice: 15\n ambulance: 115\nFire: 16'); }
    else if (id === 'nearby') { Alert.alert('Nearby Help', 'Hospitals, shelters, and relief centers near you.'); }
    else if (id === 'flood') { Alert.alert('AI Flood Predictor', 'Real-time flood risk analysis using weather + river data.'); }
    else if (id === 'alerts') { Alert.alert('Notifications', 'No new notifications.'); }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}><Text style={{ fontSize: 18 }}>🆘</Text></View>
        <View>
          <Text style={s.headerTitle}>Help Dashboard</Text>
          <Text style={s.headerGreet}>Hello, {user.full_name || 'Affected User'}</Text>
        </View>
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        {tab === 'home' && (
          <>
            <View style={s.grid}>
              {TILES.map((t) => (
                <TouchableOpacity key={t.id} style={s.tile} onPress={() => handleTile(t.id)} activeOpacity={0.7}>
                  <View style={s.tileIconWrap}><Text style={s.tileIcon}>{t.icon}</Text></View>
                  <Text style={s.tileLabel}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Emergency bar */}
            <View style={s.emergencyBar}>
              <Text style={s.emergText}>Need immediate help? Contact emergency services</Text>
              <View style={s.emergBtns}>
                {['Call 1122', 'Rescue', 'Medical', 'Police'].map((b) => (
                  <TouchableOpacity key={b} style={s.emergBtn}><Text style={s.emergBtnText}>{b}</Text></TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {tab === 'requests' && (
          <View>
            <Text style={s.sectionTitle}>My Requests</Text>
            {loadingReq && <Text style={s.muted}>Loading...</Text>}
            {!loadingReq && requests.length === 0 && <Text style={s.muted}>No requests yet. Tap "Request Help" to submit one.</Text>}
            {requests.map((r) => {
              const badge = statusColor(r.status);
              return (
                <View key={r.id} style={s.reqCard}>
                  <View style={s.reqTop}>
                    <Text style={s.reqId}>{r.id}</Text>
                    <View style={[s.badge, { backgroundColor: badge.bg }]}><Text style={[s.badgeText, { color: badge.text }]}>{r.status}</Text></View>
                  </View>
                  <Text style={s.reqCat}>{r.category}</Text>
                  {r.city ? <Text style={s.reqCity}>{r.city}</Text> : null}
                </View>
              );
            })}
          </View>
        )}

        {tab === 'services' && (
          <View>
            <Text style={s.sectionTitle}>Services</Text>
            {['Find Safe Place', 'Route Safety', 'AI Assistant', 'Weather Alerts'].map((sv) => (
              <TouchableOpacity key={sv} style={s.svcRow} onPress={() => Alert.alert(sv, 'Coming soon in full version.')}>
                <Text style={s.svcText}>{sv}</Text>
                <Text style={s.svcArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'profile' && (
          <View style={s.profileWrap}>
            <Text style={s.sectionTitle}>Profile</Text>
            <Text style={s.proName}>{user.full_name}</Text>
            <Text style={s.proInfo}>Role: Help (Affected Person)</Text>
            {user.phone ? <Text style={s.proInfo}>Phone: {user.phone}</Text> : null}
            {user.city ? <Text style={s.proInfo}>City: {user.city}</Text> : null}
            <TouchableOpacity style={s.logoutBtn} onPress={onLogout}><Text style={s.logoutText}>Logout</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom tabs */}
      <View style={s.bottomBar}>
        {(['home', 'requests', 'services', 'profile'] as HelpTab[]).map((t) => (
          <TouchableOpacity key={t} style={s.tabBtn} onPress={() => { setTab(t); if (t === 'requests') loadRequests(); }}>
            <Text style={[s.tabText, tab === t && { color: light.help.base, fontWeight: '700' }]}>
              {t === 'home' ? '🏠' : t === 'requests' ? '📋' : t === 'services' ? '🛠' : '👤'}\n{t.charAt(0).toUpperCase() + t.slice(1)}
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
  headerIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: light.help.soft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: light.help.base },
  headerGreet: { fontSize: 12, color: light.text.secondary },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '30%', alignItems: 'center', backgroundColor: light.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: light.border },
  tileIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: light.help.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileIcon: { fontSize: 20 },
  tileLabel: { fontSize: 11, fontWeight: '600', color: light.text.primary, textAlign: 'center' },
  emergencyBar: { marginTop: 24, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  emergText: { fontSize: 12, fontWeight: '600', color: '#991B1B', marginBottom: 8 },
  emergBtns: { flexDirection: 'row', gap: 8 },
  emergBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: '#FEE2E2' },
  emergBtnText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: light.text.primary, marginBottom: 14 },
  muted: { color: light.text.muted, fontSize: 13 },
  reqCard: { backgroundColor: light.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: light.border, marginBottom: 10 },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reqId: { fontSize: 12, fontWeight: '700', color: light.text.secondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: '700' },
  reqCat: { fontSize: 14, fontWeight: '600', color: light.text.primary },
  reqCity: { fontSize: 12, color: light.text.muted, marginTop: 2 },
  svcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: light.surface, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: light.border, marginBottom: 10 },
  svcText: { fontSize: 15, fontWeight: '500', color: light.text.primary },
  svcArrow: { fontSize: 20, color: light.text.muted },
  profileWrap: { alignItems: 'flex-start' },
  proName: { fontSize: 20, fontWeight: '700', color: light.text.primary, marginBottom: 6 },
  proInfo: { fontSize: 14, color: light.text.secondary, marginBottom: 2 },
  logoutBtn: { marginTop: 24, backgroundColor: '#FEE2E2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  logoutText: { color: '#DC2626', fontWeight: '700' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: light.surface, borderTopWidth: 1, borderTopColor: light.border, paddingVertical: 10 },
  tabBtn: { alignItems: 'center' },
  tabText: { fontSize: 11, color: light.text.muted, textAlign: 'center', lineHeight: 16 },
});

export default HelpDashboard;
