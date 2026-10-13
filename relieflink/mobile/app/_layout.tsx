/**
 * ReliefLink Mobile — Root Layout (Role-Based Navigation)
 * State machine: splash -> onboarding -> role-select -> register -> {help|volunteer|admin}-app
 */

import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { light } from '../constants/lightTheme';

/* ─── Flow Screens ──────────────────────────────────────────── */
import { SplashScreen } from './splash';
import { OnboardingScreen } from './onboarding';
import { RoleSelectScreen } from './role-select';
import { RegisterScreen } from './register';

/* ─── Role Dashboards ───────────────────────────────────────── */
import { HelpDashboard } from './help';
import { VolunteerDashboard } from './volunteer';
import { AdminDashboard } from './admin';

/* ─── Auth Context ──────────────────────────────────────────── */
import { AuthProvider, useAuth, AuthUser } from '../services/authContext';
import { UserRole } from '../services/api';

/* ─── Navigation Types ──────────────────────────────────────── */
type AppFlow = 'splash' | 'onboarding' | 'role-select' | 'register' | 'app';

/* ─── Inner App (uses context) ──────────────────────────────── */
const AppNavigator: React.FC = () => {
  const [flow, setFlow] = useState<AppFlow>('splash');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { user, setUser } = useAuth();

  const handleSplashDone = () => setFlow('onboarding');
  const handleOnboardingDone = () => setFlow('role-select');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setFlow('register');
  };

  const handleRegisterComplete = (u: AuthUser) => {
    setUser(u);
    setFlow('app');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedRole(null);
    setFlow('role-select');
  };

  // ─── Render Flow Screens ─────────────────────────────────
  if (flow === 'splash') {
    return <SplashScreen onFinish={handleSplashDone} />;
  }

  if (flow === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingDone} />;
  }

  if (flow === 'role-select') {
    return <RoleSelectScreen onSelect={handleRoleSelect} onBack={() => setFlow('splash')} />;
  }

  if (flow === 'register' && selectedRole) {
    return (
      <RegisterScreen
        role={selectedRole}
        onComplete={handleRegisterComplete}
        onBack={() => setFlow('role-select')}
      />
    );
  }

  // ─── Render Role Dashboard ───────────────────────────────
  if (flow === 'app' && user) {
    if (user.role === 'help') return <HelpDashboard user={user} onLogout={handleLogout} />;
    if (user.role === 'volunteer') return <VolunteerDashboard user={user} onLogout={handleLogout} />;
    if (user.role === 'admin') return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Fallback
  return <RoleSelectScreen onSelect={handleRoleSelect} onBack={() => setFlow('splash')} />;
};

/* ─── Root Layout (wraps with AuthProvider) ─────────────────── */
const RootLayout: React.FC = () => {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={light.bg} />
        <AppNavigator />
      </View>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.bg,
  },
});

export default RootLayout;
