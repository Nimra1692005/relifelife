import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../constants/theme';

/* ─── Screens ───────────────────────────────────────────── */
import { SplashScreen } from './splash';
import { OnboardingScreen } from './onboarding';
import { PermissionSetup } from './permissions';

/* ─── Tab Screens ───────────────────────────────────────── */
import { HomeScreen } from './(tabs)/home';
import { MapScreen } from './(tabs)/map';
import { WeatherScreen } from './(tabs)/weather';
import { SOSScreen } from './(tabs)/sos';
import { AIAssistantScreen } from './(tabs)/ai';
import { ProfileScreen } from './(tabs)/profile';

/* ─── Modal Screens ─────────────────────────────────────── */
import { FindSafePlaceScreen } from './(modals)/find-safe-place';
import { SafeNavigationScreen } from './(modals)/safe-navigation';
import { NearbyHelpScreen } from './(modals)/nearby-help';
import { NotificationsScreen } from './(modals)/notifications';
import { RouteSafetyScreen } from './(modals)/route-safety';

/* ─── Custom Tab Bar ────────────────────────────────────── */
import { CustomTabBar } from './(tabs)/_layout';

/* ─── Navigation Types ──────────────────────────────────── */

type MainTab = 'home' | 'map' | 'weather' | 'sos' | 'ai' | 'profile';
type ModalScreen =
  | 'find-safe-place'
  | 'safe-navigation'
  | 'nearby-help'
  | 'notifications'
  | 'route-safety'
  | null;

type AppFlow = 'splash' | 'onboarding' | 'permissions' | 'main';

/* ─── Root Layout ───────────────────────────────────────── */
/*
  This is the main app entry point that manages the full
  navigation flow: Splash → Onboarding → Permissions → Main Tabs.
  
  In production, replace this with Expo Router's file-based
  routing and a proper state management solution.
*/

const RootLayout: React.FC = () => {
  const [flow, setFlow] = useState<AppFlow>('splash');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [modal, setModal] = useState<ModalScreen>(null);

  // ─── Flow Navigation ────────────────────────────────────

  const handleSplashDone = () => setFlow('onboarding');
  const handleOnboardingDone = () => setFlow('permissions');
  const handlePermissionsDone = () => setFlow('main');

  // ─── Tab Navigation ─────────────────────────────────────

  const handleTabPress = (tab: string) => {
    setModal(null);
    setActiveTab(tab as MainTab);
  };

  // ─── Modal Navigation ──────────────────────────────────

  const openModal = (screen: ModalScreen) => setModal(screen);
  const closeModal = () => setModal(null);

  // ─── Render Flow Screens ────────────────────────────────

  if (flow === 'splash') {
    return <SplashScreen onFinish={handleSplashDone} />;
  }

  if (flow === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingDone} />;
  }

  if (flow === 'permissions') {
    return <PermissionSetup onComplete={handlePermissionsDone} />;
  }

  // ─── Render Active Tab ──────────────────────────────────

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            navigation={{ navigate: openModal, switchTab: (t: string) => setActiveTab(t as MainTab) }}
          />
        );
      case 'map':
        return <MapScreen />;
      case 'weather':
        return (
          <WeatherScreen
            navigation={{ navigate: openModal }}
          />
        );
      case 'sos':
        return <SOSScreen />;
      case 'ai':
        return <AIAssistantScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onNavigate={openModal} />;
    }
  };

  // ─── Render Modal Overlay ───────────────────────────────

  const renderModal = () => {
    if (!modal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {modal === 'find-safe-place' && (
            <FindSafePlaceScreen onBack={closeModal} />
          )}
          {modal === 'safe-navigation' && (
            <SafeNavigationScreen onBack={closeModal} />
          )}
          {modal === 'nearby-help' && (
            <NearbyHelpScreen onBack={closeModal} />
          )}
          {modal === 'notifications' && (
            <NotificationsScreen onBack={closeModal} />
          )}
          {modal === 'route-safety' && (
            <RouteSafetyScreen onBack={closeModal} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      {/* Active tab screen */}
      <View style={{ flex: 1 }}>{renderTab()}</View>

      {/* Custom bottom tab bar */}
      <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Modal overlay */}
      {renderModal()}
    </View>
  );
};

/* ─── Styles ────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.base,
    zIndex: 100,
  },
  modalContent: {
    flex: 1,
  },
});

export default RootLayout;
