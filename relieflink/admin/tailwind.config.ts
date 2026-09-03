import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ─── Colors ─────────────────────────────────────────
      colors: {
        brand: {
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
        },
        surface: {
          base: '#06090F',
          elevated: '#0B1120',
          card: '#0F1729',
          'card-hover': '#131D33',
          glass: 'rgba(15, 23, 42, 0.65)',
          'glass-light': 'rgba(30, 41, 69, 0.55)',
        },
        severity: {
          safe: '#22C55E',
          low: '#84CC16',
          medium: '#F59E0B',
          high: '#EF4444',
          critical: '#F43F5E',
        },
        disaster: {
          flood: '#3B82F6',
          earthquake: '#A855F7',
          fire: '#F97316',
          landslide: '#A3825A',
          storm: '#6366F1',
          rain: '#0EA5E9',
        },
      },

      // ─── Typography ─────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.375rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.625rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.625rem', { lineHeight: '2rem' }],
        '4xl': ['2rem', { lineHeight: '2.375rem' }],
        '5xl': ['2.5rem', { lineHeight: '2.875rem' }],
        'metric': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
      },

      // ─── Spacing ────────────────────────────────────────
      spacing: {
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '2.5': '0.625rem',
        '3': '0.75rem',
        '3.5': '0.875rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        sidebar: '16.5rem',
      },

      // ─── Border Radius ──────────────────────────────────
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        'card': '1rem',
        'modal': '1.5rem',
        'pill': '9999px',
      },

      // ─── Borders ────────────────────────────────────────
      borderColor: {
        'glass': 'rgba(148, 163, 184, 0.08)',
        'glass-hover': 'rgba(148, 163, 184, 0.15)',
        'glass-active': 'rgba(40, 82, 255, 0.35)',
      },

      // ─── Shadows ────────────────────────────────────────
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px rgba(40, 82, 255, 0.30)',
        'glow-accent': '0 0 20px rgba(10, 172, 238, 0.30)',
        'glow-emergency': '0 0 25px rgba(239, 68, 68, 0.40)',
        'glow-safe': '0 0 20px rgba(34, 197, 94, 0.30)',
        'glow-critical': '0 0 30px rgba(244, 63, 94, 0.50)',
        'glow-sos': '0 0 40px rgba(255, 0, 64, 0.60)',
        'inner-glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },

      // ─── Animations ─────────────────────────────────────
      keyframes: {
        'pulse-sos': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '50%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(40, 82, 255, 0.2)' },
          '50%': { boxShadow: '0 0 35px rgba(40, 82, 255, 0.45)' },
        },
        'metric-count': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(148, 163, 184, 0.08)' },
          '50%': { borderColor: 'rgba(40, 82, 255, 0.3)' },
        },
      },
      animation: {
        'pulse-sos': 'pulse-sos 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.35s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'metric-count': 'metric-count 0.6s ease-out',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
      },

      // ─── Backdrop Blur ──────────────────────────────────
      backdropBlur: {
        glass: '20px',
        'glass-heavy': '40px',
      },

      // ─── Transition ─────────────────────────────────────
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
