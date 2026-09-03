import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../../constants/theme';
import { SOSButton } from '../../components/sos/SOSButton';
import { StatusTimeline } from '../../components/sos/StatusTimeline';
import { mockEmergencyContacts, mockUser } from '../../utils/sampleData';
import {
  captureLocation,
  submitSOSRequest,
  createTrackingSimulator,
  EMERGENCY_TYPES,
  type EmergencyType,
  type EmergencyTypeInfo,
  type CapturedLocation,
  type SOSRequestResponse,
  type SOSPayload,
} from '../../services/sosApi';

// ─── State Machine ─────────────────────────────────────

type SOSStep =
  | 'idle'
  | 'selecting'
  | 'locating'
  | 'message'
  | 'confirming'
  | 'sending'
  | 'tracking'
  | 'error';

// ─── Main Component ────────────────────────────────────

export const SOSScreen: React.FC = () => {
  const [step, setStep] = useState<SOSStep>('idle');
  const [selectedType, setSelectedType] = useState<EmergencyTypeInfo | null>(null);
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<SOSRequestResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [locationUpdating, setLocationUpdating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const simulatorRef = useRef<{ stop: () => void } | null>(null);

  // Clean up simulator on unmount
  useEffect(() => {
    return () => {
      simulatorRef.current?.stop();
    };
  }, []);

  // ─── Transition Animation ──────────────────────────────

  const animateTransition = useCallback(
    (nextStep: SOSStep) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  // ─── Flow Handlers ─────────────────────────────────────

  const handleSOSPress = () => {
    animateTransition('selecting');
  };

  const handleSelectType = (type: EmergencyTypeInfo) => {
    setSelectedType(type);
    // Auto-advance to location capture
    animateTransition('locating');
    captureLocationAutomatically();
  };

  const captureLocationAutomatically = async () => {
    setLocationUpdating(true);
    try {
      const loc = await captureLocation();
      setLocation(loc);
      setLocationUpdating(false);
      // Auto-advance to message step
      setTimeout(() => animateTransition('message'), 600);
    } catch {
      setLocationUpdating(false);
      setErrorMsg('Failed to capture location. Please try again.');
      animateTransition('error');
    }
  };

  const handleRefreshLocation = async () => {
    setLocationUpdating(true);
    try {
      const loc = await captureLocation();
      setLocation(loc);
      setLocationUpdating(false);
    } catch {
      setLocationUpdating(false);
    }
  };

  const handleMessageContinue = () => {
    animateTransition('confirming');
  };

  const handleSendSOS = async () => {
    animateTransition('sending');

    if (!selectedType || !location) return;

    const payload: SOSPayload = {
      user_id: mockUser.id,
      emergency_type: selectedType.id,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    try {
      const res = await submitSOSRequest(payload);
      setResponse(res);
      animateTransition('tracking');

      // Start tracking simulation
      setTimeout(() => {
        simulatorRef.current = createTrackingSimulator(res, (updated) => {
          setResponse({ ...updated });
        });
      }, 500);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Failed to send emergency request. Please try again.'
      );
      animateTransition('error');
    }
  };

  const handleRetry = () => {
    setErrorMsg('');
    animateTransition('confirming');
  };

  const handleStartOver = () => {
    simulatorRef.current?.stop();
    setSelectedType(null);
    setLocation(null);
    setMessage('');
    setResponse(null);
    setErrorMsg('');
    animateTransition('idle');
  };

  const handleBack = () => {
    switch (step) {
      case 'selecting':
        animateTransition('idle');
        break;
      case 'message':
        animateTransition('selecting');
        break;
      case 'confirming':
        animateTransition('message');
        break;
      default:
        break;
    }
  };

  // ─── Step indicator ────────────────────────────────────

  const stepIndex: Record<string, number> = {
    selecting: 1,
    locating: 2,
    message: 3,
    confirming: 4,
  };

  const showStepIndicator = ['selecting', 'locating', 'message', 'confirming'].includes(step);

  const renderStepIndicator = () => {
    if (!showStepIndicator) return null;
    const current = stepIndex[step] || 1;
    const total = 4;

    return (
      <View style={styles.stepBar}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={styles.stepBarItem}>
            <View
              style={[
                styles.stepDot,
                i + 1 <= current ? styles.stepDotActive : styles.stepDotInactive,
                i + 1 === current && styles.stepDotCurrent,
              ]}
            />
            {i < total - 1 && (
              <View
                style={[
                  styles.stepLine,
                  i + 1 < current ? styles.stepLineActive : styles.stepLineInactive,
                ]}
              />
            )}
          </View>
        ))}
        <Text style={styles.stepCounter}>
          Step {current} of {total}
        </Text>
      </View>
    );
  };

  // ─── Animated wrapper ──────────────────────────────────

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  // ─── Render ────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency SOS</Text>
          {step !== 'idle' && step !== 'tracking' && (
            <TouchableOpacity onPress={handleBack} style={styles.backPill}>
              <Text style={styles.backPillText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {renderStepIndicator()}

        <Animated.View style={animatedStyle}>
          {/* ── IDLE: SOS Button + Contacts ──────────── */}
          {step === 'idle' && (
            <View>
              <Text style={styles.subtitle}>
                Send your location to rescue teams instantly
              </Text>

              {/* Location card */}
              <View style={styles.locationCard}>
                <View style={styles.locationIcon}>
                  <Text style={{ fontSize: 18 }}>📍</Text>
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Your Current Location</Text>
                  <Text style={styles.locationAddress}>
                    Sector G-11/2, Islamabad
                  </Text>
                  <Text style={styles.locationCoords}>
                    33.6844°N, 73.0479°E
                  </Text>
                </View>
                <TouchableOpacity style={styles.updateBtn}>
                  <Text style={styles.updateBtnText}>Update</Text>
                </TouchableOpacity>
              </View>

              {/* SOS Button */}
              <View style={styles.sosArea}>
                <SOSButton onPress={handleSOSPress} size={160} />
                <Text style={styles.sosHint}>
                  Tap to send emergency request
                </Text>
              </View>

              {/* Emergency Contacts */}
              <View style={styles.contactsSection}>
                <Text style={styles.contactsTitle}>Emergency Numbers</Text>
                <View style={styles.contactsGrid}>
                  {mockEmergencyContacts.map((contact, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.contactCard}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.contactIcon}>📞</Text>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactNumber}>{contact.number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── SELECTING: Emergency Type ────────────── */}
          {step === 'selecting' && (
            <View>
              <Text style={styles.selectTitle}>What type of emergency?</Text>
              <Text style={styles.selectSubtitle}>
                Select the type so rescue teams know what to prepare for
              </Text>

              <View style={styles.typeGrid}>
                {EMERGENCY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      selectedType?.id === type.id && {
                        borderColor: type.color + '60',
                        backgroundColor: type.color + '12',
                      },
                    ]}
                    onPress={() => handleSelectType(type)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.typeIconWrap,
                        {
                          backgroundColor: type.color + '15',
                          borderColor: type.color + '25',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 26 }}>{type.icon}</Text>
                    </View>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDesc} numberOfLines={2}>
                      {type.description}
                    </Text>
                    <View
                      style={[
                        styles.urgencyPill,
                        {
                          backgroundColor:
                            type.urgency === 'critical'
                              ? 'rgba(239,68,68,0.1)'
                              : type.urgency === 'high'
                                ? 'rgba(245,158,11,0.1)'
                                : 'rgba(59,130,246,0.1)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          {
                            color:
                              type.urgency === 'critical'
                                ? '#F87171'
                                : type.urgency === 'high'
                                  ? '#FBBF24'
                                  : '#60A5FA',
                          },
                        ]}
                      >
                        {type.urgency.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── LOCATING: GPS Capture ────────────────── */}
          {step === 'locating' && (
            <View style={styles.centeredStep}>
              <View style={styles.locatingCard}>
                {locationUpdating ? (
                  <>
                    <View style={styles.locatingPulseOuter}>
                      <View style={styles.locatingPulseMid}>
                        <View style={styles.locatingPulseInner}>
                          <Text style={{ fontSize: 28 }}>📍</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.locatingTitle}>
                      Capturing Your Location...
                    </Text>
                    <Text style={styles.locatingSubtitle}>
                      Please stay still while we get your precise GPS coordinates
                    </Text>
                    <View style={styles.locatingBar}>
                      <View style={styles.locatingBarFill} />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.locationSuccessIcon}>
                      <Text style={{ fontSize: 32 }}>✅</Text>
                    </View>
                    <Text style={styles.locatingSuccessTitle}>
                      Location Captured
                    </Text>
                    {location && (
                      <View style={styles.locatingDetails}>
                        <View style={styles.locatingDetailRow}>
                          <Text style={styles.locatingDetailLabel}>Address</Text>
                          <Text style={styles.locatingDetailValue}>
                            {location.address}
                          </Text>
                        </View>
                        <View style={styles.locatingDetailRow}>
                          <Text style={styles.locatingDetailLabel}>
                            Coordinates
                          </Text>
                          <Text style={styles.locatingDetailValueMono}>
                            {location.latitude.toFixed(6)}°N,{' '}
                            {location.longitude.toFixed(6)}°E
                          </Text>
                        </View>
                        <View style={styles.locatingDetailRow}>
                          <Text style={styles.locatingDetailLabel}>Accuracy</Text>
                          <Text style={styles.locatingDetailValue}>
                            ±{location.accuracy} meters
                          </Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.refreshLocBtn}
                      onPress={handleRefreshLocation}
                    >
                      <Text style={styles.refreshLocBtnText}>
                        🔄 Refresh Location
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* ── MESSAGE: Optional text ──────────────── */}
          {step === 'message' && (
            <View>
              <Text style={styles.selectTitle}>Add a Message</Text>
              <Text style={styles.selectSubtitle}>
                Help rescue teams understand your situation better (optional)
              </Text>

              <View style={styles.messageCard}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="e.g., Trapped on 3rd floor, water rising fast..."
                  placeholderTextColor={colors.text.tertiary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                />
                <View style={styles.messageMeta}>
                  <Text style={styles.messageCount}>{message.length}/300</Text>
                </View>

                {/* Quick phrases */}
                <Text style={styles.quickPhrasesLabel}>Quick phrases:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickPhrasesRow}
                >
                  {[
                    'Trapped inside building',
                    'Need medical help',
                    'Water rising fast',
                    'Injured, cannot move',
                    'Multiple people here',
                    'Children / elderly present',
                  ].map((phrase, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.quickPhrase}
                      onPress={() =>
                        setMessage((prev) =>
                          prev ? prev + '. ' + phrase : phrase
                        )
                      }
                    >
                      <Text style={styles.quickPhraseText}>{phrase}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleMessageContinue}
              >
                <Text style={styles.continueBtnText}>Continue to Review →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleMessageContinue}
              >
                <Text style={styles.skipBtnText}>Skip — No message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── CONFIRMING: Review ──────────────────── */}
          {step === 'confirming' && selectedType && location && (
            <View>
              <Text style={styles.selectTitle}>Review & Send</Text>
              <Text style={styles.selectSubtitle}>
                Confirm your emergency details before sending
              </Text>

              <View style={styles.reviewCard}>
                {/* Emergency type */}
                <View style={styles.reviewRow}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      {
                        backgroundColor: selectedType.color + '15',
                        borderColor: selectedType.color + '25',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{selectedType.icon}</Text>
                  </View>
                  <View style={styles.reviewContent}>
                    <Text style={styles.reviewLabel}>Emergency Type</Text>
                    <Text style={styles.reviewValue}>
                      {selectedType.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewDivider} />

                {/* Location */}
                <View style={styles.reviewRow}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      {
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        borderColor: 'rgba(59,130,246,0.15)',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>📍</Text>
                  </View>
                  <View style={styles.reviewContent}>
                    <Text style={styles.reviewLabel}>Location</Text>
                    <Text style={styles.reviewValue}>{location.address}</Text>
                    <Text style={styles.reviewSub}>
                      {location.latitude.toFixed(6)}°N, {location.longitude.toFixed(6)}°E
                      {' • ±'}{location.accuracy}m
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewDivider} />

                {/* Timestamp */}
                <View style={styles.reviewRow}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      {
                        backgroundColor: 'rgba(139,92,246,0.1)',
                        borderColor: 'rgba(139,92,246,0.15)',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>🕐</Text>
                  </View>
                  <View style={styles.reviewContent}>
                    <Text style={styles.reviewLabel}>Timestamp</Text>
                    <Text style={styles.reviewValue}>
                      {new Date().toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Message (if provided) */}
                {message.trim().length > 0 && (
                  <>
                    <View style={styles.reviewDivider} />
                    <View style={styles.reviewRow}>
                      <View
                        style={[
                          styles.reviewIconWrap,
                          {
                            backgroundColor: 'rgba(245,158,11,0.1)',
                            borderColor: 'rgba(245,158,11,0.15)',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>💬</Text>
                      </View>
                      <View style={styles.reviewContent}>
                        <Text style={styles.reviewLabel}>Message</Text>
                        <Text style={styles.reviewMessage}>{message}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Warning notice */}
              <View style={styles.warningNotice}>
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text style={styles.warningText}>
                  This will immediately alert all nearby rescue teams and share
                  your live location with emergency services.
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleStartOver}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendSOS}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sendBtnText}>🆘 SEND EMERGENCY</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── SENDING: Loading ────────────────────── */}
          {step === 'sending' && (
            <View style={styles.centeredStep}>
              <View style={styles.sendingCard}>
                <View style={styles.sendingSpinnerOuter}>
                  <View style={styles.sendingSpinner} />
                  <Text style={{ fontSize: 24, position: 'absolute' }}>🆘</Text>
                </View>
                <Text style={styles.sendingTitle}>
                  Sending Emergency Request...
                </Text>
                <Text style={styles.sendingSubtitle}>
                  Contacting rescue services with your location
                </Text>
                <View style={styles.sendingProgress}>
                  <View style={styles.sendingProgressFill} />
                </View>
              </View>
            </View>
          )}

          {/* ── TRACKING: Live Status ───────────────── */}
          {step === 'tracking' && response && (
            <View>
              {/* Success banner */}
              <View style={styles.trackingBanner}>
                <View style={styles.trackingBannerGlow} />
                <Text style={styles.trackingBannerIcon}>✅</Text>
                <Text style={styles.trackingBannerTitle}>
                  Emergency Request Sent
                </Text>
                <Text style={styles.trackingBannerSub}>
                  Your request has been received and rescue teams are being
                  mobilized
                </Text>
              </View>

              {/* ETA + Request ID card */}
              <View style={styles.trackingMetaCard}>
                <View style={styles.trackingMetaItem}>
                  <Text style={styles.trackingMetaValue}>
                    {response.id}
                  </Text>
                  <Text style={styles.trackingMetaLabel}>Request ID</Text>
                </View>
                <View style={styles.trackingMetaSep} />
                <View style={styles.trackingMetaItem}>
                  <Text
                    style={[
                      styles.trackingMetaValue,
                      { color: '#F87171' },
                    ]}
                  >
                    {response.priority.toUpperCase()}
                  </Text>
                  <Text style={styles.trackingMetaLabel}>Priority</Text>
                </View>
                <View style={styles.trackingMetaSep} />
                <View style={styles.trackingMetaItem}>
                  <Text
                    style={[
                      styles.trackingMetaValue,
                      { color: '#4ADE80' },
                    ]}
                  >
                    ~{response.estimated_eta_minutes} min
                  </Text>
                  <Text style={styles.trackingMetaLabel}>Est. ETA</Text>
                </View>
              </View>

              {/* Status Timeline */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Status Timeline</Text>
                <StatusTimeline phases={response.tracking_phases} />
              </View>

              {/* Stay safe card */}
              <View style={styles.staySafeCard}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staySafeTitle}>Stay Safe</Text>
                  <Text style={styles.staySafeText}>
                    Stay in a visible, safe location. Keep your phone charged.
                    Do not move unless instructed by rescue teams.
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={styles.newSosBtn}
                onPress={handleStartOver}
              >
                <Text style={styles.newSosBtnText}>Send Another SOS</Text>
              </TouchableOpacity>

              {/* Emergency contacts */}
              <Text style={styles.contactsTitle}>Quick Call</Text>
              <View style={styles.trackingContactsRow}>
                {mockEmergencyContacts.slice(0, 4).map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.trackingContact}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14 }}>📞</Text>
                    <Text style={styles.trackingContactName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.trackingContactNum}>{c.number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── ERROR ───────────────────────────────── */}
          {step === 'error' && (
            <View style={styles.centeredStep}>
              <View style={styles.errorCard}>
                <View style={styles.errorIcon}>
                  <Text style={{ fontSize: 40 }}>⚠️</Text>
                </View>
                <Text style={styles.errorTitle}>Something Went Wrong</Text>
                <Text style={styles.errorMsg}>
                  {errorMsg ||
                    'Unable to send emergency request. Please check your connection and try again.'}
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryBtnText}>↻ Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.errorCancelBtn}
                  onPress={handleStartOver}
                >
                  <Text style={styles.errorCancelText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  backPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  backPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },

  // Step indicator
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  stepBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepDotActive: { backgroundColor: colors.brand.primary },
  stepDotInactive: { backgroundColor: 'rgba(148,163,184,0.15)' },
  stepDotCurrent: {
    backgroundColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  stepLineActive: { backgroundColor: colors.brand.primary },
  stepLineInactive: { backgroundColor: 'rgba(148,163,184,0.1)' },
  stepCounter: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginLeft: 8,
  },

  // Location card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: { flex: 1 },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontFamily: 'JetBrains Mono',
  },
  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  updateBtnText: { fontSize: 11, fontWeight: '600', color: '#60A5FA' },

  // SOS Area
  sosArea: { alignItems: 'center', marginBottom: 36 },
  sosHint: { fontSize: 13, color: colors.text.tertiary, marginTop: 20 },

  // Selecting
  selectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 6,
  },
  selectSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  typeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Locating
  centeredStep: { alignItems: 'center', justifyContent: 'center' },
  locatingCard: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  locatingPulseOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59,130,246,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  locatingPulseMid: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locatingPulseInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locatingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  locatingSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  locatingBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  locatingBarFill: {
    width: '65%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
  locationSuccessIcon: { marginBottom: 12 },
  locatingSuccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ADE80',
    marginBottom: 16,
  },
  locatingDetails: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  locatingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locatingDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locatingDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  locatingDetailValueMono: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
    fontFamily: 'JetBrains Mono',
  },
  refreshLocBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  refreshLocBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
  },

  // Message step
  messageCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 20,
  },
  messageInput: {
    width: '100%',
    minHeight: 100,
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
    paddingTop: 0,
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  messageCount: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontFamily: 'JetBrains Mono',
  },
  quickPhrasesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  quickPhrasesRow: {
    gap: 8,
  },
  quickPhrase: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  quickPhraseText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
  },

  // Confirming / Review
  reviewCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  reviewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reviewContent: { flex: 1 },
  reviewLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
    fontFamily: 'JetBrains Mono',
  },
  reviewMessage: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: 14,
  },
  warningNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.12)',
    gap: 10,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  sendBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    shadowColor: '#FF0040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  // Sending
  sendingCard: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
  },
  sendingSpinnerOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  sendingSpinner: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(239,68,68,0.15)',
    borderTopColor: '#EF4444',
  },
  sendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sendingSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  sendingProgress: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  sendingProgressFill: {
    width: '70%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },

  // Tracking
  trackingBanner: {
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  trackingBannerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(34,197,94,0.06)',
    top: -30,
  },
  trackingBannerIcon: { fontSize: 36, marginBottom: 10 },
  trackingBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4ADE80',
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  trackingBannerSub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  trackingMetaCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  trackingMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  trackingMetaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  trackingMetaLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackingMetaSep: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },

  timelineCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
    letterSpacing: -0.2,
  },

  staySafeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(40,82,255,0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(40,82,255,0.12)',
    gap: 12,
    marginBottom: 16,
  },
  staySafeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 3,
  },
  staySafeText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  newSosBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    marginBottom: 24,
  },
  newSosBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },

  // Emergency Contacts
  contactsSection: { marginTop: 8 },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 14,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactCard: {
    width: '48%',
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    flexGrow: 1,
  },
  contactIcon: { fontSize: 20, marginBottom: 6 },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
    textAlign: 'center',
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.primaryLight,
    fontFamily: 'JetBrains Mono',
  },

  trackingContactsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  trackingContact: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  trackingContactName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 4,
  },
  trackingContactNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primaryLight,
    fontFamily: 'JetBrains Mono',
    marginTop: 2,
  },

  // Error
  errorCard: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
  },
  errorIcon: { marginBottom: 16 },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    marginBottom: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
});
