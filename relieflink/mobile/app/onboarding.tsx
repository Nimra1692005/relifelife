import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { colors } from '../../constants/theme';
import { mockOnboardingSlides } from '../../utils/sampleData';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (activeIndex < mockOnboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: typeof mockOnboardingSlides[0] }) => (
    <View style={[styles.slide, { width }]}>
      {/* Background gradient circles */}
      <View
        style={[
          styles.slideBg1,
          { backgroundColor: item.gradient[0] + '40' },
        ]}
      />
      <View
        style={[
          styles.slideBg2,
          { backgroundColor: item.gradient[1] + '30' },
        ]}
      />

      {/* Emoji icon */}
      <View style={styles.emojiContainer}>
        <View style={styles.emojiGlow} />
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      </View>

      {/* Text */}
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Skip button */}
      {activeIndex < mockOnboardingSlides.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={mockOnboardingSlides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        keyExtractor={(item) => item.id.toString()}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {mockOnboardingSlides.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            activeIndex === mockOnboardingSlides.length - 1 && styles.getStartedBtn,
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.nextBtnText,
              activeIndex === mockOnboardingSlides.length - 1 &&
                styles.getStartedText,
            ]}
          >
            {activeIndex === mockOnboardingSlides.length - 1
              ? 'Get Started'
              : 'Next'}
          </Text>
          {activeIndex < mockOnboardingSlides.length - 1 && (
            <Text style={styles.arrowIcon}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slideBg1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: '10%',
    left: '-20%',
  },
  slideBg2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: '25%',
    right: '-15%',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  emojiGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(40, 82, 255, 0.08)',
  },
  emojiCircle: {
    width: 130,
    height: 130,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  getStartedBtn: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    shadowColor: '#2852FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  getStartedText: {
    color: '#FFFFFF',
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
  },
});
