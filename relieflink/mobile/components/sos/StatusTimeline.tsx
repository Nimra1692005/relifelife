import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/theme';
import type { TrackingPhaseStatus } from '../../services/sosApi';

/**
 * StatusTimeline — Premium animated timeline for SOS tracking
 *
 * Shows progressive status updates with:
 * - Completed phases with checkmarks
 * - Active phase with pulse animation
 * - Pending phases dimmed
 * - Connector lines that fill as phases complete
 */

interface StatusTimelineProps {
  phases: TrackingPhaseStatus[];
}

const phaseIcons: Record<string, string> = {
  received: '📋',
  notified: '📡',
  assigned: '👥',
  en_route: '🚑',
  arrived: '✅',
};

const TimelineStep: React.FC<{
  phase: TrackingPhaseStatus;
  isLast: boolean;
  index: number;
}> = ({ phase, isLast, index }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  useEffect(() => {
    if (phase.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase.status]);

  const isCompleted = phase.status === 'completed';
  const isActive = phase.status === 'active';
  const isPending = phase.status === 'pending';

  const formatTime = (ts: string | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <Animated.View style={[styles.stepContainer, { opacity: fadeIn }]}>
      {/* Left column: node + connector */}
      <View style={styles.nodeColumn}>
        {/* Node */}
        <View style={styles.nodeWrap}>
          {/* Pulse ring for active */}
          {isActive && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.4, 0],
                  }),
                },
              ]}
            />
          )}

          <View
            style={[
              styles.node,
              isCompleted && styles.nodeCompleted,
              isActive && styles.nodeActive,
              isPending && styles.nodePending,
            ]}
          >
            {isCompleted ? (
              <Text style={styles.nodeCheck}>✓</Text>
            ) : isActive ? (
              <Text style={{ fontSize: 13 }}>{phaseIcons[phase.phase] || '⏳'}</Text>
            ) : (
              <View style={styles.nodeDot} />
            )}
          </View>
        </View>

        {/* Connector line */}
        {!isLast && (
          <View style={styles.connectorBg}>
            <View
              style={[
                styles.connectorFill,
                isCompleted && styles.connectorFillDone,
              ]}
            />
          </View>
        )}
      </View>

      {/* Right column: content */}
      <View style={[styles.contentColumn, isLast && styles.contentColumnLast]}>
        <Text
          style={[
            styles.stepLabel,
            isCompleted && styles.stepLabelCompleted,
            isActive && styles.stepLabelActive,
            isPending && styles.stepLabelPending,
          ]}
        >
          {phase.label}
        </Text>

        {(isCompleted || isActive) && phase.detail && (
          <Text style={styles.stepDetail}>{phase.detail}</Text>
        )}

        {isCompleted && phase.timestamp && (
          <Text style={styles.stepTime}>{formatTime(phase.timestamp)}</Text>
        )}

        {isActive && !phase.timestamp && (
          <View style={styles.inProgressBadge}>
            <View style={styles.inProgressDot} />
            <Text style={styles.inProgressText}>In progress...</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ phases }) => {
  return (
    <View style={styles.container}>
      {phases.map((phase, index) => (
        <TimelineStep
          key={phase.phase}
          phase={phase}
          isLast={index === phases.length - 1}
          index={index}
        />
      ))}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  stepContainer: {
    flexDirection: 'row',
    minHeight: 64,
  },

  // Node column
  nodeColumn: {
    width: 40,
    alignItems: 'center',
  },
  nodeWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  node: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeCompleted: {
    backgroundColor: '#22C55E',
    borderWidth: 0,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  nodeActive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 2,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  nodePending: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  nodeCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(148,163,184,0.25)',
  },

  // Connector
  connectorBg: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(148,163,184,0.1)',
    marginVertical: 4,
    borderRadius: 1,
    overflow: 'hidden',
    minHeight: 28,
  },
  connectorFill: {
    width: '100%',
    flex: 0,
    borderRadius: 1,
  },
  connectorFillDone: {
    flex: 1,
    backgroundColor: '#22C55E',
  },

  // Content
  contentColumn: {
    flex: 1,
    paddingBottom: 20,
    paddingLeft: 8,
  },
  contentColumnLast: {
    paddingBottom: 0,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  stepLabelCompleted: {
    color: colors.text.primary,
  },
  stepLabelActive: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  stepLabelPending: {
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  stepDetail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 3,
    lineHeight: 18,
  },
  stepTime: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginTop: 4,
    fontFamily: 'JetBrains Mono',
    letterSpacing: 0.5,
  },

  // In-progress badge
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  inProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4ADE80',
  },
});
