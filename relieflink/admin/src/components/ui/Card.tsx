import React from 'react';

type CardVariant = 'glass' | 'solid' | 'elevated' | 'outline';
type SeverityAccent = 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'none';

interface CardProps {
  variant?: CardVariant;
  severity?: SeverityAccent;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  glass: 'glass-card glass-highlight noise-overlay',
  solid:
    'bg-surface-card border border-glass rounded-card transition-all duration-normal',
  elevated:
    'bg-surface-elevated border border-glass rounded-card shadow-glass transition-all duration-normal',
  outline:
    'bg-transparent border border-glass rounded-card transition-all duration-normal',
};

const hoverStyles: Record<CardVariant, string> = {
  glass: '',
  solid: 'hover:bg-surface-card-hover hover:border-glass-hover',
  elevated: 'hover:bg-surface-card hover:shadow-glass-lg',
  outline: 'hover:border-glass-hover hover:bg-white/[0.02]',
};

const severityAccentMap: Record<SeverityAccent, string> = {
  safe: 'border-l-[3px] border-l-emerald-500',
  low: 'border-l-[3px] border-l-lime-500',
  medium: 'border-l-[3px] border-l-amber-500',
  high: 'border-l-[3px] border-l-red-500',
  critical: 'border-l-[3px] border-l-rose-500',
  none: '',
};

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const Card: React.FC<CardProps> = ({
  variant = 'glass',
  severity = 'none',
  hover = false,
  glow = false,
  padding = 'md',
  className = '',
  children,
  onClick,
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        ${variantStyles[variant]}
        ${hover ? hoverStyles[variant] : ''}
        ${severityAccentMap[severity]}
        ${paddingMap[padding]}
        ${glow ? 'shadow-glow-primary' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/* ── Card Sub-components ────────────────────────────────── */

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
}) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => (
  <div className={`mt-4 pt-4 border-t border-glass ${className}`}>
    {children}
  </div>
);
