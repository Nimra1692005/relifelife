/**
 * ReliefLink Mobile — Theme & Design Tokens
 * React Native (Expo) + NativeWind
 */

export const colors = {
  // ─── Brand ──────────────────────────────────────────────
  brand: {
    primary: '#2852FF',
    primaryLight: '#5375FF',
    primaryDark: '#0A35EB',
    accent: '#0AACEE',
    accentLight: '#5CC8FF',
  },

  // ─── Background ─────────────────────────────────────────
  bg: {
    base: '#06090F',
    elevated: '#0B1120',
    card: '#0F1729',
    cardHover: '#131D33',
    input: '#0D1322',
    overlay: 'rgba(0, 0, 0, 0.70)',
  },

  // ─── Text ───────────────────────────────────────────────
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
    link: '#60A5FA',
    white: '#FFFFFF',
    onEmergency: '#FFFFFF',
  },

  // ─── Severity ───────────────────────────────────────────
  severity: {
    safe: { solid: '#22C55E', bg: '#052E16', text: '#4ADE80', border: '#166534' },
    low: { solid: '#84CC16', bg: '#1C2A0F', text: '#A3E635', border: '#4D7C0F' },
    medium: { solid: '#F59E0B', bg: '#342200', text: '#FBBF24', border: '#92400E' },
    high: { solid: '#EF4444', bg: '#3B0A0A', text: '#F87171', border: '#991B1B' },
    critical: { solid: '#F43F5E', bg: '#3B0013', text: '#FB7185', border: '#9F1239' },
  },

  // ─── Disaster ───────────────────────────────────────────
  disaster: {
    flood: '#3B82F6',
    earthquake: '#A855F7',
    fire: '#F97316',
    landslide: '#A3825A',
    storm: '#6366F1',
    extremeRain: '#0EA5E9',
  },

  // ─── Borders ────────────────────────────────────────────
  border: {
    subtle: 'rgba(148, 163, 184, 0.06)',
    default: 'rgba(148, 163, 184, 0.10)',
    medium: 'rgba(148, 163, 184, 0.18)',
    strong: 'rgba(148, 163, 184, 0.30)',
    focus: 'rgba(40, 82, 255, 0.50)',
    glass: 'rgba(148, 163, 184, 0.08)',
  },

  // ─── Utility ────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Typography ────────────────────────────────────────────
export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    display: 'SpaceGrotesk-Bold',
  },
  sizes: {
    xs2: 10,
    xs: 12,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 26,
    '4xl': 32,
    metric: 36,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ─── Spacing ───────────────────────────────────────────────
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ─── Border Radius ─────────────────────────────────────────
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  card: 16,
  modal: 24,
  pill: 9999,
  full: 9999,
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    primary: {
      shadowColor: '#2852FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    emergency: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 25,
      elevation: 10,
    },
    sos: {
      shadowColor: '#FF0040',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 40,
      elevation: 15,
    },
    safe: {
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
