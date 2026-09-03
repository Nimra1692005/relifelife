import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../constants/theme';

/* ─── Tab Configuration ─────────────────────────────────── */

interface TabConfig {
  key: string;
  label: string;
  icon: string;
  iconActive: string;
  isSOS?: boolean;
}

const tabs: TabConfig[] = [
  { key: 'home', label: 'Home', icon: '🏠', iconActive: '🏠' },
  { key: 'map', label: 'Map', icon: '🗺️', iconActive: '🗺️' },
  { key: 'weather', label: 'Weather', icon: '🌦️', iconActive: '🌦️' },
  { key: 'sos', label: 'SOS', icon: '🆘', iconActive: '🆘', isSOS: true },
  { key: 'ai', label: 'AI', icon: '🤖', iconActive: '🤖' },
  { key: 'profile', label: 'Profile', icon: '👤', iconActive: '👤' },
];

/* ─── Custom Bottom Tab Bar ─────────────────────────────── */

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const CustomTabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Glassmorphism background overlay */}
        <View style={styles.tabBarGlass} />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          if (tab.isSOS) {
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.sosTabWrapper}
                onPress={() => onTabPress(tab.key)}
                activeOpacity={0.8}
              >
                <View style={styles.sosTabOuter}>
                  <View style={styles.sosTabGlow} />
                  <View
                    style={[
                      styles.sosTab,
                      isActive && styles.sosTabActive,
                    ]}
                  >
                    <Text style={styles.sosIcon}>🆘</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.sosLabel,
                    isActive && styles.sosLabelActive,
                  ]}
                >
                  SOS
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIconWrap,
                  isActive && styles.tabIconWrapActive,
                ]}
              >
                <Text style={styles.tabIcon}>
                  {isActive ? tab.iconActive : tab.icon}
                </Text>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ─── Simple Tab Navigator ──────────────────────────────── */
/* 
  This is a lightweight tab navigator for UI development.
  Replace with Expo Router tabs or React Navigation in production.
*/

interface TabNavigatorProps {
  children: Record<string, React.ReactNode>;
  initialTab?: string;
}

export const SimpleTabNavigator: React.FC<TabNavigatorProps> = ({
  children,
  initialTab = 'home',
}) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      {/* Active screen */}
      <View style={{ flex: 1 }}>
        {children[activeTab] || null}
      </View>

      {/* Custom tab bar */}
      <CustomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

/* ─── Styles ────────────────────────────────────────────── */

const styles = StyleSheet.create({
  // Tab Bar Container
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 4,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  tabBarGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 17, 32, 0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
  },

  // Regular Tab
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    zIndex: 1,
  },
  tabIconWrap: {
    width: 42,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(40, 82, 255, 0.1)',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.brand.primaryLight,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
  },

  // SOS Tab (special)
  sosTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: -18,
    flex: 1,
  },
  sosTabOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sosTabGlow: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  sosTab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  sosTabActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  sosIcon: {
    fontSize: 22,
  },
  sosLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F87171',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sosLabelActive: {
    color: '#EF4444',
  },
});
