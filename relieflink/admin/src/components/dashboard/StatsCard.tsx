import React from 'react';

/* ─── Stats Card ────────────────────────────────────────── */

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: { value: string; direction: 'up' | 'down'; positive?: boolean };
  icon: React.ReactNode;
  accent?: 'brand' | 'danger' | 'warning' | 'success' | 'info';
  glow?: boolean;
}

const accentConfig = {
  brand: {
    iconBg: 'bg-brand-500/10',
    iconColor: 'text-brand-400',
    borderAccent: 'border-l-brand-500',
    glowClass: 'shadow-glow-primary',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    borderAccent: 'border-l-red-500',
    glowClass: 'shadow-glow-emergency',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderAccent: 'border-l-amber-500',
    glowClass: '',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    borderAccent: 'border-l-emerald-500',
    glowClass: 'shadow-glow-safe',
  },
  info: {
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    borderAccent: 'border-l-sky-500',
    glowClass: '',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  icon,
  accent = 'brand',
  glow = false,
}) => {
  const config = accentConfig[accent];

  return (
    <div
      className={`
        glass-card glass-highlight noise-overlay p-5
        border-l-[3px] ${config.borderAccent}
        ${glow ? config.glowClass : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl ${config.iconBg} ${config.iconColor}
                      flex items-center justify-center`}
        >
          {icon}
        </div>
        {change && (
          <span
            className={`
              metric-change
              ${change.direction === 'up'
                ? change.positive !== false
                  ? 'metric-change-up'
                  : 'metric-change-down'
                : change.positive !== false
                  ? 'metric-change-down'
                  : 'metric-change-up'
              }
            `}
          >
            {change.direction === 'up' ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
              </svg>
            )}
            {change.value}
          </span>
        )}
      </div>

      <p className="metric-value text-white">{value}</p>
      <p className="metric-label mt-1">{label}</p>
    </div>
  );
};

/* ─── Live Metrics Bar ──────────────────────────────────── */

interface MetricItem {
  label: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
}

interface LiveMetricsBarProps {
  metrics: MetricItem[];
}

const metricStatusColors = {
  normal: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

const metricDotColors = {
  normal: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
};

export const LiveMetricsBar: React.FC<LiveMetricsBarProps> = ({ metrics }) => (
  <div className="glass-surface rounded-2xl px-6 py-3 flex items-center gap-8 overflow-x-auto">
    <div className="flex items-center gap-2 pr-4 border-r border-glass flex-shrink-0">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
        <span className="relative rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="text-2xs font-semibold text-emerald-400 uppercase tracking-widest">
        Live
      </span>
    </div>

    {metrics.map((metric, i) => (
      <div key={i} className="flex items-center gap-2.5 flex-shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${metricDotColors[metric.status]}
                        ${metric.status === 'critical' ? 'animate-pulse-dot' : ''}`}
        />
        <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-bold font-display ${metricStatusColors[metric.status]}`}>
            {metric.value}
          </span>
          <span className="text-2xs text-slate-500 font-medium">{metric.label}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Active Incident Row ───────────────────────────────── */

interface IncidentProps {
  id: string;
  type: 'flood' | 'earthquake' | 'fire' | 'landslide' | 'storm' | 'extreme_rain';
  title: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time: string;
  affected: number;
}

const disasterIconMap: Record<string, string> = {
  flood: '🌊',
  earthquake: '🫨',
  fire: '🔥',
  landslide: '⛰️',
  storm: '🌪️',
  extreme_rain: '🌧️',
};

const severityPillMap: Record<string, string> = {
  low: 'status-low',
  medium: 'status-medium',
  high: 'status-high',
  critical: 'status-critical',
};

export const IncidentRow: React.FC<IncidentProps> = ({
  type,
  title,
  location,
  severity,
  time,
  affected,
}) => (
  <div className="table-row flex items-center gap-4 py-3.5 px-4">
    {/* Icon */}
    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-lg flex-shrink-0">
      {disasterIconMap[type]}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-200 truncate">{title}</p>
      <p className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        {location}
      </p>
    </div>

    {/* Severity */}
    <span className={`status-pill ${severityPillMap[severity]}`}>
      {severity}
    </span>

    {/* Affected */}
    <div className="text-right flex-shrink-0">
      <p className="text-sm font-semibold text-slate-300">{affected.toLocaleString()}</p>
      <p className="text-2xs text-slate-500">affected</p>
    </div>

    {/* Time */}
    <span className="text-2xs text-slate-500 flex-shrink-0 w-16 text-right">{time}</span>
  </div>
);
