import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface CommandCenterProps {
  activePage: string;
  pageTitle: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  activePage,
  pageTitle,
  subtitle,
  headerActions,
  onNavigate,
  children,
}) => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-base">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Main content area */}
      <div className="ml-sidebar h-screen flex flex-col">
        {/* Header */}
        <Header
          pageTitle={pageTitle}
          subtitle={subtitle}
          actions={headerActions}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

/* ─── Page Container (inner page wrapper) ───────────────── */

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-4xl',
  md: 'max-w-6xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1600px]',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'full',
  className = '',
}) => (
  <div className={`mx-auto ${maxWidthMap[maxWidth]} ${className}`}>
    {children}
  </div>
);
