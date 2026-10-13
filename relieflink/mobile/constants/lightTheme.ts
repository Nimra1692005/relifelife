/**
 * ReliefLink Mobile — Light Theme Design Tokens
 * Matches the role-based mockup: clean white surfaces, role accent colors.
 * Help = emerald, Volunteer = blue, Admin = purple.
 */

export const light = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },

  // Role accents
  help: { base: '#059669', soft: '#ECFDF5', text: '#047857' },
  volunteer: { base: '#2563EB', soft: '#EFF6FF', text: '#1D4ED8' },
  admin: { base: '#7C3AED', soft: '#F5F3FF', text: '#6D28D9' },

  // Severity (light-mode friendly)
  severity: {
    safe: '#10B981',
    low: '#22C55E',
    medium: '#EAB308',
    high: '#F97316',
    critical: '#EF4444',
  },

  // Status badge backgrounds
  status: {
    pending: { bg: '#FEF3C7', text: '#B45309' },
    assigned: { bg: '#DBEAFE', text: '#1D4ED8' },
    in_progress: { bg: '#E0E7FF', text: '#4338CA' },
    resolved: { bg: '#D1FAE5', text: '#047857' },
    completed: { bg: '#D1FAE5', text: '#047857' },
    open: { bg: '#E2E8F0', text: '#475569' },
    claimed: { bg: '#DBEAFE', text: '#1D4ED8' },
  },

  brand: '#0EA5A5',
} as const;

// Priority → color for task badges
export const priorityColor = (p: string): { bg: string; text: string } => {
  switch (p) {
    case 'critical':
      return { bg: '#FEE2E2', text: '#B91C1C' };
    case 'high':
      return { bg: '#FFEDD5', text: '#C2410C' };
    case 'medium':
      return { bg: '#FEF9C3', text: '#A16207' };
    default:
      return { bg: '#DCFCE7', text: '#15803D' };
  }
};

export const statusColor = (s: string): { bg: string; text: string } => {
  const key = s?.toLowerCase() as keyof typeof light.status;
  return light.status[key] || { bg: '#E2E8F0', text: '#475569' };
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
