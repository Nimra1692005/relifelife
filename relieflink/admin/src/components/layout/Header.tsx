import React from 'react';
import { LiveIndicator } from '../ui/StatusPill';

interface HeaderProps {
  pageTitle: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  subtitle,
  actions,
}) => {
  return (
    <header className="glass-header h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold font-display text-slate-100 tracking-tight">
            {pageTitle}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 -mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Center: Live status strip */}
      <div className="hidden lg:flex items-center gap-6">
        <LiveIndicator color="red" label="12 Active SOS" />
        <div className="h-4 w-px bg-glass" />
        <LiveIndicator color="amber" label="3 Warnings" />
        <div className="h-4 w-px bg-glass" />
        <LiveIndicator color="green" label="8 Teams Online" />
        <div className="h-4 w-px bg-glass" />
        <span className="text-xs text-slate-500 font-mono">
          {new Date().toLocaleTimeString('en-PK', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}{' '}
          PKT
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search requests, shelters..."
            className="w-64 bg-white/[0.04] border border-glass rounded-xl
                       pl-10 pr-4 py-2 text-xs text-slate-300
                       placeholder:text-slate-500 focus:outline-none
                       focus:border-glass-active focus:ring-1
                       focus:ring-brand-500/20 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs
                         text-slate-500 bg-white/[0.06] px-1.5 py-0.5 rounded
                         border border-glass font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Notification bell */}
        <button
          className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-200
                     hover:bg-white/5 border border-transparent hover:border-glass
                     transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="notification-badge">5</span>
        </button>

        {/* Send Alert button */}
        {actions}
      </div>
    </header>
  );
};
