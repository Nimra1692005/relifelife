/**
 * ReliefLink Mobile — Role Registration Screen
 * Dynamic form per selected role (mockup screen 3)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { light, radius } from '../constants/lightTheme';
import { UserRole, registerRole, adminSignIn } from '../services/api';
import { AuthUser } from '../services/authContext';

interface Props {
  role: UserRole;
  onComplete: (user: AuthUser) => void;
  onBack: () => void;
}

const HELP_CATEGORIES = [
  'Emergency Rescue', 'Medical', 'Food & Water', 'Shelter',
  'Clothing', 'Transport', 'Sanitation', 'Special Assistance',
  'Home Recovery', 'Missing Persons', 'Psychological', 'Flood Predictor',
];

const SKILL_OPTIONS = ['Medical', 'Rescue', 'Food', 'Transport', 'Shelter', 'Logistics', 'Counseling', 'Search'];
const AVAILABILITY_OPTIONS = ['Full-time', 'Weekends', 'Evenings', 'On-call'];

export const RegisterScreen: React.FC<Props> = ({ role, onComplete, onBack }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const accent = role === 'help' ? light.help.base : role === 'volunteer' ? light.volunteer.base : light.admin.base;
  const title = role === 'help' ? 'Help' : role === 'volunteer' ? 'Volunteer' : 'Admin';
  const subtitle = role === 'help' ? '(Affected Person)' : role === 'volunteer' ? '' : '';

  const toggleSkill = (s: string) => {
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (role === 'admin') {
        const res = await adminSignIn(email, password);
        const u = res.data.user;
        onComplete({ id: u.id, full_name: u.full_name, role: 'admin' });
      } else {
        const res = await registerRole({
          role,
          full_name: fullName || undefined,
          phone: phone || undefined,
          city: city || undefined,
          category: category || undefined,
          urgent,
          skills: skills.length ? skills : undefined,
          availability: availability || undefined,
        });
        const u = res.data.user;
        onComplete({ id: u.id, full_name: u.full_name, role, city, phone });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Registration failed. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={[styles.title, { color: accent }]}>{title} {subtitle && <Text style={styles.subLabel}>{subtitle}</Text>}</Text>
          </View>

          {/* Admin: email + password */}
          {role === 'admin' ? (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="admin@relieflink.pk" keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            </>
          ) : (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your name" />
              <Text style={styles.label}>Phone / WhatsApp</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+92-3XX-XXXXXXX" keyboardType="phone-pad" />
              <Text style={styles.label}>City / Area</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Lahore, Islamabad" />

              {role === 'help' && (
                <>
                  <Text style={styles.label}>Help Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {HELP_CATEGORIES.map((c) => (
                      <TouchableOpacity key={c} style={[styles.chip, category === c && { backgroundColor: accent }]} onPress={() => setCategory(c)}>
                        <Text style={[styles.chipText, category === c && { color: '#fff' }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.checkbox} onPress={() => setUrgent(!urgent)}>
                    <View style={[styles.box, urgent && { backgroundColor: accent }]} />
                    <Text style={styles.checkLabel}>Mark as Urgent</Text>
                  </TouchableOpacity>
                </>
              )}

              {role === 'volunteer' && (
                <>
                  <Text style={styles.label}>Skills</Text>
                  <View style={styles.skillGrid}>
                    {SKILL_OPTIONS.map((s) => (
                      <TouchableOpacity key={s} style={[styles.chip, skills.includes(s) && { backgroundColor: accent }]} onPress={() => toggleSkill(s)}>
                        <Text style={[styles.chipText, skills.includes(s) && { color: '#fff' }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.label}>Availability</Text>
                  <View style={styles.skillGrid}>
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <TouchableOpacity key={a} style={[styles.chip, availability === a && { backgroundColor: accent }]} onPress={() => setAvailability(a)}>
                        <Text style={[styles.chipText, availability === a && { color: '#fff' }]}>{a}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accent }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.submitText}>{loading ? 'Submitting...' : role === 'admin' ? 'Sign In' : role === 'help' ? 'Submit Request' : 'Register'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.bg },
  scroll: { padding: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 12 },
  backText: { color: light.text.secondary, fontSize: 14 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  subLabel: { fontSize: 14, fontWeight: '400', color: light.text.muted },
  label: { fontSize: 13, fontWeight: '600', color: light.text.secondary, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: light.text.primary,
  },
  chipScroll: { flexDirection: 'row', marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.surface,
    marginRight: 8,
  },
  chipText: { fontSize: 12, color: light.text.secondary, fontWeight: '500' },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  checkbox: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  box: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: light.borderStrong, marginRight: 8,
  },
  checkLabel: { fontSize: 14, color: light.text.primary },
  submitBtn: {
    marginTop: 32, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default RegisterScreen;
