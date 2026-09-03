import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../../constants/theme';

/**
 * SOSButton — Animated pulsing emergency SOS button
 *
 * Features:
 * - Triple-ring pulse animation
 * - Haptic-ready press state
 * - Glow shadow effect
 * - Accessibility: large touch target, clear label
 */

interface SOSButtonProps {
  onPress: () => void;
  size?: number;
  disabled?: boolean;
  loading?: boolean;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onPress,
  size = 140,
  disabled = false,
  loading = false,
}) => {
  const pulseAnim1 = React.useRef(new Animated.Value(0.8)).current;
  const pulseAnim2 = React.useRef(new Animated.Value(0.8)).current;
  const pulseAnim3 = React.useRef(new Animated.Value(0.8)).current;
  const breatheAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1.6,
              duration: 2000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

    // Reset values
    pulseAnim1.setValue(0.8);
    pulseAnim2.setValue(0.8);
    pulseAnim3.setValue(0.8);

    createPulse(pulseAnim1, 0).start();
    createPulse(pulseAnim2, 400).start();
    createPulse(pulseAnim3, 800).start();

    // Breathe animation for the main button
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.04,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Pulse Ring 3 (outermost) */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size + 60,
            height: size + 60,
            borderRadius: (size + 60) / 2,
            transform: [{ scale: pulseAnim3 }],
            opacity: pulseAnim3.interpolate({
              inputRange: [0.8, 1.6],
              outputRange: [0.15, 0],
            }),
          },
        ]}
      />

      {/* Pulse Ring 2 */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            transform: [{ scale: pulseAnim2 }],
            opacity: pulseAnim2.interpolate({
              inputRange: [0.8, 1.6],
              outputRange: [0.2, 0],
            }),
          },
        ]}
      />

      {/* Pulse Ring 1 (innermost) */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            transform: [{ scale: pulseAnim1 }],
            opacity: pulseAnim1.interpolate({
              inputRange: [0.8, 1.6],
              outputRange: [0.3, 0],
            }),
          },
        ]}
      />

      {/* Main SOS Button */}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Send SOS Emergency Request"
      >
        <Animated.View
          style={[
            styles.mainButton,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: breatheAnim }],
            },
          ]}
        >
          {/* Inner glow ring */}
          <View
            style={[
              styles.innerRing,
              {
                width: size - 12,
                height: size - 12,
                borderRadius: (size - 12) / 2,
              },
            ]}
          >
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.subText}>
              {loading ? 'Sending...' : 'TAP FOR HELP'}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 64, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 0, 64, 0.2)',
  },
  mainButton: {
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0040',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 15,
  },
  innerRing: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  sosText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 3,
    marginTop: 4,
    fontFamily: 'Inter-SemiBold',
  },
});
