/**
 * ReliefLink Mobile — Onboarding (light theme)
 * Swipeable intro slides leading into role selection.
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Animated, Dimensions, SafeAreaView,
} from 'react-native';
import { light, radius } from '../constants/lightTheme';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
}

const SLIDES: Slide[] = [
  { id: 1, emoji: '🛡️', title: 'Stay Safe, Stay Connected', subtitle: 'Real-time disaster alerts and safety information for every citizen of Pakistan.', accent: light.help.base },
  { id: 2, emoji: '🆘', title: 'One Tap Emergency Help', subtitle: 'Send your request to rescue teams instantly. Help reaches you faster.', accent: light.volunteer.base },
  { id: 3, emoji: '🤖', title: 'AI Flood Predictor', subtitle: 'Chat in English, Urdu, or Roman Urdu. Get safety guidance tailored to you.', accent: light.admin.base },
  { id: 4, emoji: '🧭', title: 'Find Safe Routes', subtitle: 'Navigate away from danger with real-time safe route guidance.', accent: light.brand },
];

interface Props {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (!isLast) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {!isLast && (
        <TouchableOpacity style={s.skipBtn} onPress={onComplete}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={[s.emojiCircle, { backgroundColor: item.accent + '15' }]}>
              <Text style={s.emoji}>{item.emoji}</Text>
            </View>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.subtitle}>{item.subtitle}</Text>
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) =>
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      />

      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.bg },
  skipBtn: { position: 'absolute', top: 16, right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 14, fontWeight: '600', color: light.text.secondary },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emojiCircle: { width: 130, height: 130, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  emoji: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800', color: light.text.primary, textAlign: 'center', marginBottom: 14 },
  subtitle: { fontSize: 15, color: light.text.secondary, textAlign: 'center', lineHeight: 23 },
  bottom: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center', gap: 24 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: light.borderStrong },
  dotActive: { backgroundColor: light.brand, width: 24 },
  nextBtn: { width: '100%', paddingVertical: 16, borderRadius: radius.md, backgroundColor: light.brand, alignItems: 'center' },
  nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default OnboardingScreen;
