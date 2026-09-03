/**
 * ReliefLink — Color Design Tokens
 * Premium emergency response platform color system
 *
 * Philosophy: Deep dark backgrounds + glass effects + emergency gradients
 */

// ─── Brand Colors ───────────────────────────────────────────
export const brand = {
  primary: {
    50: '#EEF2FF',
    100: '#D4DEFF',
    200: '#A9BBFF',
    300: '#7E98FF',
    400: '#5375FF',
    500: '#2852FF',
    600: '#0A35EB',
    700: '#0028C2',
    800: '#001F99',
    900: '#001566',
    DEFAULT: '#2852FF',
  },
  accent: {
    50: '#F0F9FF',
    100: '#D4F0FF',
    200: '#A9E2FF',
    300: '#5CC8FF',
    400: '#0AACEE',
    500: '#0090CC',
    600: '#0072A3',
    700: '#00567A',
    800: '#003D57',
    900: '#002636',
    DEFAULT: '#0AACEE',
  },
} as const;

// ─── Emergency / Severity Colors ────────────────────────────
export const severity = {
  safe: {
    bg: '#052E16',
    bgLight: '#14532D',
    text: '#4ADE80',
    border: '#166534',
    glow: 'rgba(74, 222, 128, 0.25)',
    solid: '#22C55E',
    DEFAULT: '#22C55E',
  },
  low: {
    bg: '#1C2A0F',
    bgLight: '#365314',
    text: '#A3E635',
    border: '#4D7C0F',
    glow: 'rgba(163, 230, 53, 0.25)',
    solid: '#84CC16',
    DEFAULT: '#84CC16',
  },
  medium: {
    bg: '#342200',
    bgLight: '#713F12',
    text: '#FBBF24',
    border: '#92400E',
    glow: 'rgba(251, 191, 36, 0.25)',
    solid: '#F59E0B',
    DEFAULT: '#F59E0B',
  },
  high: {
    bg: '#3B0A0A',
    bgLight: '#7F1D1D',
    text: '#F87171',
    border: '#991B1B',
    glow: 'rgba(248, 113, 113, 0.30)',
    solid: '#EF4444',
    DEFAULT: '#EF4444',
  },
  critical: {
    bg: '#3B0013',
    bgLight: '#881337',
    text: '#FB7185',
    border: '#9F1239',
    glow: 'rgba(251, 113, 133, 0.40)',
    solid: '#F43F5E',
    pulse: '#FF0040',
    DEFAULT: '#F43F5E',
  },
} as const;

// ─── Dark Theme Surface Colors ──────────────────────────────
export const surface = {
  // Primary background layers
  base: '#06090F',         // Deepest background
  elevated: '#0B1120',     // Slightly raised
  card: '#0F1729',         // Card backgrounds
  cardHover: '#131D33',    // Card hover state

  // Glass / frosted surfaces
  glass: 'rgba(15, 23, 42, 0.65)',
  glassLight: 'rgba(30, 41, 69, 0.55)',
  glassBorder: 'rgba(148, 163, 184, 0.08)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.60)',
  overlayHeavy: 'rgba(0, 0, 0, 0.80)',
} as const;

// ─── Light Theme Surface Colors (for contrast modes) ────────
export const surfaceLight = {
  base: '#F8FAFC',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  glass: 'rgba(255, 255, 255, 0.75)',
  glassLight: 'rgba(255, 255, 255, 0.90)',
  glassBorder: 'rgba(148, 163, 184, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.40)',
} as const;

// ─── Text Colors ────────────────────────────────────────────
export const text = {
  primary: '#F1F5F9',      // Main text on dark
  secondary: '#94A3B8',    // Secondary / muted
  tertiary: '#64748B',     // Tertiary / placeholder
  inverse: '#0F172A',      // Text on light surfaces
  disabled: '#475569',
  link: '#60A5FA',
  onEmergency: '#FFFFFF',
} as const;

// ─── Border Colors ──────────────────────────────────────────
export const border = {
  subtle: 'rgba(148, 163, 184, 0.08)',
  default: 'rgba(148, 163, 184, 0.12)',
  medium: 'rgba(148, 163, 184, 0.20)',
  strong: 'rgba(148, 163, 184, 0.35)',
  focus: 'rgba(40, 82, 255, 0.50)',
  glow: 'rgba(40, 82, 255, 0.25)',
} as const;

// ─── Gradient Presets ───────────────────────────────────────
export const gradients = {
  heroPrimary: 'linear-gradient(135deg, #0A1628 0%, #0F172A 50%, #1A0A2E 100%)',
  heroAccent: 'linear-gradient(135deg, #2852FF 0%, #0AACEE 100%)',
  emergencyRed: 'linear-gradient(135deg, #EF4444 0%, #F43F5E 100%)',
  emergencyAmber: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  safeGreen: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
  glassCard: 'linear-gradient(135deg, rgba(30,41,69,0.6) 0%, rgba(15,23,42,0.4) 100%)',
  glassCardHover: 'linear-gradient(135deg, rgba(40,55,90,0.65) 0%, rgba(20,30,55,0.5) 100%)',
  sidebarActive: 'linear-gradient(90deg, rgba(40,82,255,0.15) 0%, transparent 100%)',
  sosButton: 'radial-gradient(circle, #FF0040 0%, #EF4444 40%, #DC2626 70%)',
  sosPulse: 'radial-gradient(circle, rgba(255,0,64,0.4) 0%, transparent 70%)',
  mapSafe: 'linear-gradient(to top, rgba(34,197,94,0.3) 0%, transparent 100%)',
  mapDanger: 'linear-gradient(to top, rgba(239,68,68,0.3) 0%, transparent 100%)',
} as const;

// ─── Shadow Presets ─────────────────────────────────────────
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  glow: {
    primary: '0 0 20px rgba(40, 82, 255, 0.30)',
    accent: '0 0 20px rgba(10, 172, 238, 0.30)',
    emergency: '0 0 25px rgba(239, 68, 68, 0.40)',
    safe: '0 0 20px rgba(34, 197, 94, 0.30)',
    critical: '0 0 30px rgba(244, 63, 94, 0.50)',
    sos: '0 0 40px rgba(255, 0, 64, 0.60)',
  },
} as const;

// ─── Disaster Type Colors ───────────────────────────────────
export const disasterColors = {
  flood: { primary: '#3B82F6', secondary: '#1D4ED8', icon: '🌊' },
  earthquake: { primary: '#A855F7', secondary: '#7C3AED', icon: '🫨' },
  fire: { primary: '#F97316', secondary: '#EA580C', icon: '🔥' },
  landslide: { primary: '#A3825A', secondary: '#78623E', icon: '⛰️' },
  storm: { primary: '#6366F1', secondary: '#4F46E5', icon: '🌪️' },
  extreme_rain: { primary: '#0EA5E9', secondary: '#0284C7', icon: '🌧️' },
} as const;

// ─── Export All ─────────────────────────────────────────────
export const colors = {
  brand,
  severity,
  surface,
  surfaceLight,
  text,
  border,
  gradients,
  shadows,
  disasterColors,
} as const;
