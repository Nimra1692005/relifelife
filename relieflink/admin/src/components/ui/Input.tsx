import React from 'react';

/* ─── Input ─────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  icon,
  iconRight,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-white/[0.04] border rounded-xl
            px-4 py-2.5 text-sm text-slate-200
            placeholder:text-slate-500 transition-all duration-normal
            focus:outline-none focus:ring-1
            ${error
              ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/30'
              : 'border-glass focus:border-glass-active focus:ring-brand-500/30'
            }
            ${icon ? 'pl-10' : ''}
            ${iconRight ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {iconRight}
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="text-2xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-2xs text-red-400">{error}</p>
      )}
    </div>
  );
};

/* ─── Select ────────────────────────────────────────────── */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  placeholder = 'Select...',
  error,
  className = '',
  ...props
}) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-xs font-medium text-slate-300">
        {label}
      </label>
    )}
    <select
      className={`
        w-full bg-white/[0.04] border rounded-xl appearance-none
        px-4 py-2.5 text-sm text-slate-200
        transition-all duration-normal cursor-pointer
        focus:outline-none focus:ring-1
        ${error
          ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/30'
          : 'border-glass focus:border-glass-active focus:ring-brand-500/30'
        }
        ${className}
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled className="bg-surface-card text-slate-500">
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-surface-card">
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-2xs text-red-400">{error}</p>}
  </div>
);

/* ─── Tabs ──────────────────────────────────────────────── */

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => (
  <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-glass">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm
          font-medium transition-all duration-normal
          ${active === tab.id
            ? 'bg-brand-500/15 text-brand-300 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }
        `}
      >
        {tab.icon}
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={`
              ml-1 px-1.5 py-0.5 text-2xs rounded-md font-semibold
              ${active === tab.id
                ? 'bg-brand-500/20 text-brand-300'
                : 'bg-white/5 text-slate-500'
              }
            `}
          >
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

/* ─── Textarea ──────────────────────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-xs font-medium text-slate-300">
        {label}
      </label>
    )}
    <textarea
      className={`
        w-full bg-white/[0.04] border rounded-xl resize-none
        px-4 py-3 text-sm text-slate-200
        placeholder:text-slate-500 transition-all duration-normal
        focus:outline-none focus:ring-1
        ${error
          ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/30'
          : 'border-glass focus:border-glass-active focus:ring-brand-500/30'
        }
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-2xs text-red-400">{error}</p>}
  </div>
);
