import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'sos' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-base gap-2.5',
};

const variantClasses: Record<string, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500/40 shadow-glow-primary',
  ghost:
    'bg-transparent text-slate-300 hover:bg-white/5 border border-glass hover:border-glass-hover focus:ring-slate-500/30',
  danger:
    'bg-red-500/90 text-white hover:bg-red-600 focus:ring-red-500/40 shadow-glow-emergency',
  sos:
    'bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold uppercase tracking-wider shadow-glow-sos focus:ring-rose-500/40',
  success:
    'bg-emerald-500/90 text-white hover:bg-emerald-600 focus:ring-emerald-500/40 shadow-glow-safe',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  glow = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-normal rounded-xl cursor-pointer
        select-none focus:outline-none focus:ring-2
        disabled:opacity-40 disabled:cursor-not-allowed
        disabled:shadow-none active:scale-[0.97]
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${glow ? 'animate-glow-pulse' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}

      <span>{children}</span>

      {iconRight && !loading && (
        <span className="flex-shrink-0">{iconRight}</span>
      )}
    </button>
  );
};
