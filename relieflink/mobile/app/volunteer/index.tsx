/**
 * ReliefLink Mobile — Volunteer Dashboard
 * Blue-themed: Available Tasks, My Assignments, Stats, Quick Actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput, RefreshControl,
} from 'react-native';
import { light, radius, priorityColor, statusColor } from '../../constants/lightTheme';
import { getAvailableTasks, claimTask, getVolunteerStats, VolunteerTask, VolunteerStats } from '../../services/api';
import { AuthUser } from '../../services/authContext';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

type VolTab = 'tasks' | 'assignments' | 'progress' | 'profile';

export const VolunteerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<VolTab>('tasks');
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const res = await getAvailableTasks({ category, location: 'all', search });
      setTasks(res.data || []);
    } catch { /* offline */ }
  }, [category, search]);

  const loadStats = useCallback(async () => {
    try {
      const res = await getVolunteerStats();
      setStats(res.data);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { loadTasks(); loadStats(); }, [loadTasks, loadStats]);

  const onRefresh = async () => { setRefreshing(true); await loadTasks(); setRefreshing(false); };

  const handleClaim = async (taskId: string) => {
    try {
      await claimTask(taskId, user.id);
      Alert.alert('Success', 'Task claimed! Check My Assignments.');
      loadTasks();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const CATS = ['all', 'food', 'medical', 'rescue', 'shelter', 'transport'];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}><Text style={{ fontSize: 18 }}>🙋</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Volunteer Dashboard</Text>
          <Text style={s.headerGreet}>Hello, {user.full_name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {tab === 'tasks' && (
          <>
            {/* Filters */}
            <View style={s.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATS.map((c) => (
                  <TouchableOpacity key={c} style={[s.filterChip, category === c && { backgroundColor: light.volunteer.base }]} onPress={() => setCategory(c)}>
                    <Text style={[s.filterText, category === c && { color: '#fff' }]}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput style={s.searchInput} placeholder="Search tasks..." value={search} onChangeText={setSearch} />

            {/* Task Cards */}
            {tasks.map((t) => {
              const pc = priorityColor(t.priority);
              return (
                <View key={t.id} style={s.taskCard}>
                  <View style={s.taskTop}>
                    <View style={s.taskIcon}><Text style={{ fontSize: 16 }}>{t.category === 'food' ? '🍲' : t.category === 'medical' ? '🏥' : t.category === 'rescue' ? '🚁' : '🏠'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.taskTitle}>{t.title}</Text>
                      <Text style={s.taskMeta}>{t.city} - {t.distance_km} km</Text>
                      <Text style={s.taskSkills}>{t.skills_needed.join(', ')} | {new Date(t.created_at).getHours()}:00 ago</Text>
                    </View>
                    <View style={[s.prioBadge, { backgroundColor: pc.bg }]}><Text style={[s.prioText, { color: pc.text }]}>{t.priority}</Text></View>
                  </View>
                  <TouchableOpacity style={s.viewBtn} onPress={() => handleClaim(t.id)}>
                    <Text style={s.viewBtnText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            {tasks.length === 0 && <Text style={s.muted}>No available tasks. Pull to refresh.</Text>}
          </>
        )}

        {tab === 'assignments' && (
          <View>
            <Text style={s.sectionTitle}>My Assignments</Text>
            <Text style={s.muted}>Tasks you've claimed will appear here.</Text>
          </View>
        )}

        {tab === 'progress' && (
          <View>
            <Text style={s.sectionTitle}>Update Progress</Text>
            <Text style={s.muted}>Select a task from My Assignments to update its progress.</Text>
          </View>
        )}

        {tab === 'profile' && (
          <View>
            <Text style={s.sectionTitle}>Your Stats</Text>
            <View style={s.statsGrid}>
              <View style={s.statCard}><Text style={s.statNum}>{stats?.tasks_completed ?? '-'}</Text><Text style={s.statLabel}>Tasks Completed</Text></View>
              <View style={s.statCard}><Text style={s.statNum}>{stats?.hours_served ?? '-'}</Text><Text style={s.statLabel}>Hours Served</Text></View>
              <View style={s.statCard}><Text style={s.statNum}>{stats?.total_impact ?? '-'}</Text><Text style={s.statLabel}>Total Impact</Text></View>
            </View>
            <Text style={[s.sectionTitle, { marginTop: 24 }]}>Quick Actions</Text>
            {['Update Profile', 'View Training', 'Help & Support'].map((a) => (
              <TouchableOpacity key={a} style={s.actionRow}><Text style={s.actionText}>{a}</Text><Text style={s.actionArrow}>›</Text></TouchableOpacity>
            ))}
            <TouchableOpacity style={s.logoutBtn} onPress={onLogout}><Text style={s.logoutText}>Logout</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom tabs */}
      <View style={s.bottomBar}>
        {(['tasks', 'assignments', 'progress', 'profile'] as VolTab[]).map((t) => (
          <TouchableOpacity key={t} style={s.tabBtn} onPress={() => setTab(t)}>
            <Text style={[s.tabLabel, tab === t && { color: light.volunteer.base, fontWeight: '700' }]}>
              {t === 'tasks' ? '📋' : t === 'assignments' ? '✅' : t === 'progress' ? '📊' : '👤'}\n{t.charAt(0).toUpperCase() + t.slice(1)}
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
  headerIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: light.volunteer.soft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: light.volunteer.base },
  headerGreet: { fontSize: 12, color: light.text.secondary },
  body: { padding: 16 },
  filterRow: { marginBottom: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: light.border, backgroundColor: light.surface, marginRight: 8 },
  filterText: { fontSize: 12, color: light.text.secondary, fontWeight: '500' },
  searchInput: { backgroundColor: light.surface, borderWidth: 1, borderColor: light.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: light.text.primary, marginBottom: 14 },
  taskCard: { backgroundColor: light.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: light.border, marginBottom: 12 },
  taskTop: { flexDirection: 'row', alignItems: 'flex-start' },
  taskIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: light.volunteer.soft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: light.text.primary },
  taskMeta: { fontSize: 12, color: light.text.secondary, marginTop: 2 },
  taskSkills: { fontSize: 11, color: light.text.muted, marginTop: 2 },
  prioBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginLeft: 8 },
  prioText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  viewBtn: { marginTop: 10, alignSelf: 'flex-end', backgroundColor: light.volunteer.base, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  muted: { color: light.text.muted, fontSize: 13, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: light.text.primary, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: light.surface, borderRadius: radius.md, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: light.border },
  statNum: { fontSize: 22, fontWeight: '800', color: light.volunteer.base },
  statLabel: { fontSize: 11, color: light.text.secondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: light.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: light.border, marginBottom: 8 },
  actionText: { fontSize: 14, color: light.text.primary, fontWeight: '500' },
  actionArrow: { fontSize: 18, color: light.text.muted },
  logoutBtn: { marginTop: 24, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  logoutText: { color: '#DC2626', fontWeight: '700' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: light.surface, borderTopWidth: 1, borderTopColor: light.border, paddingVertical: 10 },
  tabBtn: { alignItems: 'center' },
  tabLabel: { fontSize: 11, color: light.text.muted, textAlign: 'center', lineHeight: 16 },
});

export default VolunteerDashboard;
