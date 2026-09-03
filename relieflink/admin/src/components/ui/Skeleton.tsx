import React from 'react';

/* ─── Skeleton Loader ───────────────────────────────────── */

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const radiusMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
}) => (
  <div
    className={`skeleton ${radiusMap[rounded]} ${className}`}
    style={{ width, height }}
  />
);

/* ─── Skeleton Presets ──────────────────────────────────── */

export const SkeletonCard: React.FC = () => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton width="40px" height="40px" rounded="xl" />
      <div className="space-y-2 flex-1">
        <Skeleton width="60%" height="0.75rem" />
        <Skeleton width="40%" height="0.625rem" />
      </div>
    </div>
    <Skeleton height="1.5rem" />
    <Skeleton width="80%" height="0.75rem" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    <Skeleton height="0.75rem" width="100%" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-3">
        <Skeleton width="32px" height="32px" rounded="full" />
        <Skeleton height="0.75rem" className="flex-1" />
        <Skeleton height="0.75rem" width="80px" />
        <Skeleton height="1.25rem" width="70px" rounded="pill" />
      </div>
    ))}
  </div>
);

/* ─── Divider ───────────────────────────────────────────── */

interface DividerProps {
  className?: string;
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ className = '', label }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="flex-1 h-px bg-glass" />
    {label && (
      <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">
        {label}
      </span>
    )}
    <div className="flex-1 h-px bg-glass" />
  </div>
);

/* ─── Empty State ───────────────────────────────────────── */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-glass
                      flex items-center justify-center mb-4 text-slate-500">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-semibold text-slate-300 mb-1">{title}</h3>
    {description && (
      <p className="text-xs text-slate-500 max-w-xs mb-4">{description}</p>
    )}
    {action}
  </div>
);

/* ─── Avatar ────────────────────────────────────────────── */

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const statusColors = {
  online: 'bg-emerald-400',
  offline: 'bg-slate-500',
  busy: 'bg-amber-400',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${avatarSizes[size]} rounded-full object-cover border-2 border-glass`}
        />
      ) : (
        <div
          className={`${avatarSizes[size]} rounded-full bg-brand-500/15 text-brand-400
                      flex items-center justify-center font-semibold border border-brand-500/20`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
                     border-2 border-surface-base ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
