import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { colors } from '../../constants/theme';

/**
 * SplashScreen — Premium animated splash for ReliefLink
 * Shows logo, tagline, and loading indicator with staggered fade-in
 */

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Title fade
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Subtitle fade
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient effect */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          {/* Glow ring behind logo */}
          <Animated.View
            style={[
              styles.logoGlow,
              { opacity: glowAnim },
            ]}
          />
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>🌐</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[styles.title, { opacity: titleOpacity }]}
        >
          ReliefLink
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[styles.subtitle, { opacity: subtitleOpacity }]}
        >
          Pakistan's AI Emergency Response
        </Animated.Text>

        {/* Loading bar */}
        <Animated.View style={[styles.loadingBar, { opacity: subtitleOpacity }]}>
          <View style={styles.loadingBarInner} />
        </Animated.View>
      </View>

      {/* Bottom text */}
      <Animated.Text style={[styles.bottomText, { opacity: subtitleOpacity }]}>
        Protecting Lives • Powered by AI
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(40, 82, 255, 0.06)',
    top: '15%',
    left: '-20%',
  },
  bgGlow2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(10, 172, 238, 0.04)',
    bottom: '20%',
    right: '-15%',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(40, 82, 255, 0.15)',
    shadowColor: '#2852FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(40, 82, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(40, 82, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  loadingBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 40,
    overflow: 'hidden',
  },
  loadingBarInner: {
    width: '60%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
  },
  bottomText: {
    position: 'absolute',
    bottom: 60,
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 2,
  },
});
