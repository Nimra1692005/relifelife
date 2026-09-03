import React from 'react';

type Severity = 'safe' | 'low' | 'medium' | 'high' | 'critical';
type StatusType = 'pending' | 'active' | 'resolved' | 'dispatched' | 'offline' | Severity;

interface StatusPillProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; border: string; dot: string; defaultLabel: string }
> = {
  safe: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    defaultLabel: 'Safe',
  },
  low: {
    bg: 'bg-lime-500/10',
    text: 'text-lime-400',
    border: 'border-lime-500/20',
    dot: 'bg-lime-400',
    defaultLabel: 'Low',
  },
  medium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    defaultLabel: 'Medium',
  },
  high: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
    defaultLabel: 'High Risk',
  },
  critical: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
    defaultLabel: 'Critical',
  },
  pending: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
    defaultLabel: 'Pending',
  },
  active: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    defaultLabel: 'Active',
  },
  resolved: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
    defaultLabel: 'Resolved',
  },
  dispatched: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    dot: 'bg-indigo-400',
    defaultLabel: 'Dispatched',
  },
  offline: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-500',
    border: 'border-slate-500/20',
    dot: 'bg-slate-500',
    defaultLabel: 'Offline',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  pulse = false,
  size = 'sm',
}) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${size === 'sm' ? 'px-2.5 py-0.5 text-2xs' : 'px-3 py-1 text-xs'}
        rounded-pill font-semibold uppercase tracking-wider
        border
        ${config.bg} ${config.text} ${config.border}
      `}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`absolute inset-0 rounded-full ${config.dot} opacity-60 animate-ping`}
          />
        )}
        <span className={`relative rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </span>
      {label || config.defaultLabel}
    </span>
  );
};

/* ─── Badge ─────────────────────────────────────────────── */

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'danger' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-slate-500/10 text-slate-400 border-slate-500/15',
  brand: 'bg-brand-500/10 text-brand-300 border-brand-500/15',
  danger: 'bg-red-500/10 text-red-400 border-red-500/15',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/15',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
}) => (
  <span
    className={`
      inline-flex items-center gap-1 rounded-md font-medium border
      ${size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs'}
      ${badgeVariants[variant]}
    `}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    {children}
  </span>
);

/* ─── Live Indicator ────────────────────────────────────── */

interface LiveIndicatorProps {
  color?: 'green' | 'red' | 'amber' | 'blue';
  label?: string;
}

const liveColors = {
  green: { dot: 'bg-emerald-400', ping: 'bg-emerald-400' },
  red: { dot: 'bg-red-400', ping: 'bg-red-400' },
  amber: { dot: 'bg-amber-400', ping: 'bg-amber-400' },
  blue: { dot: 'bg-blue-400', ping: 'bg-blue-400' },
};

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  color = 'green',
  label = 'Live',
}) => {
  const c = liveColors[color];
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inset-0 rounded-full ${c.ping} opacity-60 animate-ping`}
        />
        <span
          className={`relative rounded-full h-2 w-2 ${c.dot}`}
        />
      </span>
      {label}
    </span>
  );
};
