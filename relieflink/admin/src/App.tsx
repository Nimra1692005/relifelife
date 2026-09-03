import React, { useState } from 'react';
import { CommandCenter } from './components/layout/CommandCenter';
import { DashboardPage } from './pages/Dashboard';

/* ─── Page registry ─────────────────────────────────────── */

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  overview:       { title: 'Command Center',        subtitle: 'Real-time emergency operations overview' },
  livemap:        { title: 'Live Map',              subtitle: 'Interactive disaster monitoring' },
  requests:       { title: 'Emergency Requests',    subtitle: 'Active SOS and rescue requests' },
  risk:           { title: 'Risk Intelligence',     subtitle: 'AI-powered threat analysis' },
  weather:        { title: 'Weather Intelligence',  subtitle: 'Weather monitoring and route safety' },
  shelters:       { title: 'Shelters',              subtitle: 'Emergency shelter management' },
  hospitals:      { title: 'Hospitals',             subtitle: 'Medical facility coordination' },
  teams:          { title: 'Rescue Teams',          subtitle: 'Field team deployment' },
  volunteers:     { title: 'Volunteers',            subtitle: 'Volunteer coordination center' },
  alerts:         { title: 'Alerts',                subtitle: 'Broadcast and manage alerts' },
  analytics:      { title: 'Analytics',             subtitle: 'Response performance metrics' },
  settings:       { title: 'Settings',              subtitle: 'System configuration' },
};

/* ─── App Root ──────────────────────────────────────────── */

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('overview');
  const page = pageConfig[activePage] || pageConfig.overview;

  const renderPage = () => {
    // Currently only the Overview/Dashboard page is fully built.
    // Other pages show a placeholder.
    if (activePage === 'overview') {
      return <DashboardPage />;
    }
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-500/10 border border-brand-500/20
                          flex items-center justify-center text-2xl">
            🛠️
          </div>
          <h2 className="text-xl font-display font-bold text-slate-200 mb-2">{page.title}</h2>
          <p className="text-sm text-slate-500 max-w-md">{page.subtitle} — module coming soon.</p>
        </div>
      </div>
    );
  };

  return (
    <CommandCenter
      activePage={activePage}
      pageTitle={page.title}
      subtitle={page.subtitle}
      onNavigate={setActivePage}
      headerActions={
        <button className="btn btn-danger btn-sm gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          Broadcast Alert
        </button>
      }
    >
      {renderPage()}
    </CommandCenter>
  );
};

export default App;
