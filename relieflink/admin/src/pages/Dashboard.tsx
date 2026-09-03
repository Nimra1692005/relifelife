import React, { useState, useEffect, useRef } from 'react';
import {
  CommandMap,
  MapLegend,
  MapToolbar,
  MapToolbarButton,
  RiskZonePin,
  SOSPin,
  HeatmapZone,
} from '../components/map/CommandMap';
import {
  StatsCard,
  LiveMetricsBar,
} from '../components/dashboard/StatsCard';
import { api } from '../services/api';

// ─── Mock Data ──────────────────────────────────────────────

interface SOSRequest {
  id: string;
  type: string;
  icon: string;
  name: string;
  location: string;
  time: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'assigned' | 'dispatched' | 'resolved';
  lat: string;
  lng: string;
}

const mockSOSRequests: SOSRequest[] = [
  { id: 'SOS-4821', type: 'Flood', icon: '🌊', name: 'Fatima Bibi', location: 'E-11/2, near Nullah Lei', time: '2 min ago', priority: 'critical', status: 'new', lat: '38%', lng: '45%' },
  { id: 'SOS-4819', type: 'Medical', icon: '🏥', name: 'Ahmed Raza', location: 'G-11/3, Street 14', time: '5 min ago', priority: 'high', status: 'assigned', lat: '42%', lng: '52%' },
  { id: 'SOS-4817', type: 'Collapse', icon: '🏚️', name: 'Saira Bano', location: 'F-10/1, House 42', time: '8 min ago', priority: 'critical', status: 'dispatched', lat: '55%', lng: '38%' },
  { id: 'SOS-4815', type: 'Fire', icon: '🔥', name: 'Usman Ali', location: 'I-8 Markaz, Shop 12', time: '12 min ago', priority: 'high', status: 'assigned', lat: '62%', lng: '65%' },
  { id: 'SOS-4813', type: 'Trapped', icon: '⛰️', name: 'Kamran Shah', location: 'Margalla Trail 3', time: '18 min ago', priority: 'medium', status: 'dispatched', lat: '28%', lng: '30%' },
  { id: 'SOS-4811', type: 'Flood', icon: '🌊', name: 'Nadia Khan', location: 'Rawal Dam downstream', time: '22 min ago', priority: 'high', status: 'resolved', lat: '48%', lng: '60%' },
  { id: 'SOS-4809', type: 'Medical', icon: '🏥', name: 'Bilal Hussain', location: 'G-10/4, Block C', time: '30 min ago', priority: 'medium', status: 'resolved', lat: '35%', lng: '55%' },
];

const liveMetrics = [
  { label: 'Response Rate', value: '94.2%', status: 'normal' as const },
  { label: 'Avg Response Time', value: '4.2 min', status: 'normal' as const },
  { label: 'Active Alerts', value: '7', status: 'warning' as const },
  { label: 'Teams Deployed', value: '8/12', status: 'normal' as const },
  { label: 'Shelters Active', value: '14', status: 'normal' as const },
  { label: 'People Evacuated', value: '1,247', status: 'critical' as const },
];

// ─── Icons ──────────────────────────────────────────────────

const iconSvg = {
  alert: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
  people: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  map: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  team: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  layers: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>,
  zoomIn: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  zoomOut: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>,
  locate: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>,
  ai: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
};

const priorityConfig = {
  critical: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'CRITICAL' },
  high: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'HIGH' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'MEDIUM' },
  low: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20', label: 'LOW' },
};

const statusLabel: Record<string, { label: string; color: string }> = {
  new: { label: 'NEW', color: 'text-rose-400' },
  assigned: { label: 'ASSIGNED', color: 'text-amber-400' },
  dispatched: { label: 'EN ROUTE', color: 'text-blue-400' },
  resolved: { label: 'RESOLVED', color: 'text-emerald-400' },
};

// ─── Emergency Feed Card ────────────────────────────────────

const FeedCard: React.FC<{ req: SOSRequest; index: number }> = ({ req, index }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);
  const p = priorityConfig[req.priority];
  const s = statusLabel[req.status];
  const isNew = req.status === 'new';

  return (
    <div
      className={`
        relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
        hover:border-glass-hover group
        ${isNew
          ? 'bg-rose-500/[0.04] border-rose-500/15 hover:bg-rose-500/[0.07]'
          : 'bg-white/[0.02] border-glass hover:bg-white/[0.04]'
        }
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
      `}
    >
      {/* New indicator pulse */}
      {isNew && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-rose-400 opacity-60 animate-ping" />
          <span className="relative rounded-full h-2.5 w-2.5 bg-rose-400" />
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center text-base flex-shrink-0`}>
          {req.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-200 font-mono">{req.id}</span>
            <span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${p.bg} ${p.text} border ${p.border}`}>
              {p.label}
            </span>
          </div>

          {/* Type + Name */}
          <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
            {req.type} — {req.name}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-3 h-3 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-2xs text-slate-500 truncate">{req.location}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xs text-slate-500">{req.time}</span>
            <span className={`text-2xs font-bold ${s.color}`}>{s.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AI Risk Intelligence Panel ─────────────────────────────

const AIRiskPanel: React.FC = () => {
  const riskScore = 72;
  const riskLevel = 'HIGH RISK';
  const riskColor = 'text-red-400';
  const riskBg = 'bg-red-500/10';
  const riskBorder = 'border-red-500/20';

  const insights = [
    { icon: '📍', label: 'Most Affected Area', value: 'Nullah Lei Corridor, E-11/F-11', accent: 'text-red-400' },
    { icon: '👥', label: 'Predicted Affected Population', value: '~8,400 people in next 6 hours', accent: 'text-amber-400' },
    { icon: '🌊', label: 'Primary Threat', value: 'Flash flood from Rawal Dam overflow', accent: 'text-blue-400' },
    { icon: '⏱️', label: 'Time Window', value: '2-4 hours before critical levels', accent: 'text-rose-400' },
  ];

  const recommendations = [
    { priority: 'critical', text: 'Deploy 2 additional rescue teams to E-11 sector immediately' },
    { priority: 'high', text: 'Issue evacuation alert for F-11 and G-11 low-lying areas' },
    { priority: 'medium', text: 'Pre-position medical supplies at F-11 Community Center shelter' },
  ];

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
            {iconSvg.ai}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">AI Risk Intelligence</h3>
            <p className="text-2xs text-slate-500">Powered by ReliefLink AI Engine</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-brand-400 opacity-60 animate-ping" />
            <span className="relative rounded-full h-2 w-2 bg-brand-400" />
          </span>
          <span className="text-2xs font-semibold text-brand-300 uppercase tracking-wider">Live</span>
        </span>
      </div>

      {/* Risk Score Display */}
      <div className={`flex items-center gap-4 p-4 rounded-xl ${riskBg} border ${riskBorder} mb-4`}>
        {/* Score ring */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="5" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(riskScore / 100) * 176} 176`}
              className={riskColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-black font-display ${riskColor}`}>{riskScore}</span>
          </div>
        </div>
        <div>
          <p className={`text-sm font-bold ${riskColor}`}>{riskLevel}</p>
          <p className="text-2xs text-slate-400 mt-0.5 leading-relaxed">
            Elevated threat due to upstream dam overflow risk combined with ongoing heavy rainfall in the Islamabad region.
          </p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {insights.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-glass">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">{item.icon}</span>
              <span className="text-2xs text-slate-500 font-medium">{item.label}</span>
            </div>
            <p className={`text-xs font-semibold ${item.accent}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* AI Recommendations */}
      <div>
        <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Recommendations</p>
        <div className="space-y-2">
          {recommendations.map((rec, i) => {
            const cfg = priorityConfig[rec.priority as keyof typeof priorityConfig];
            return (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-glass">
                <span className={`flex-shrink-0 mt-0.5 text-2xs font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                  {cfg.label}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{rec.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-glass flex items-center justify-between">
        <span className="text-2xs text-slate-500">Last updated: 30 seconds ago</span>
        <button className="text-2xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
          View Full Analysis →
        </button>
      </div>
    </div>
  );
};

// ─── Weather Intelligence Panel ─────────────────────────────

const weatherIcons: Record<string, string> = {
  clear: '☀️', partly_cloudy: '⛅', cloudy: '☁️', light_rain: '🌦️',
  heavy_rain: '🌧️', thunderstorm: '⛈️', drizzle: '🌦️', fog: '🌫️',
};

const mockAdminWeather = {
  current: { temperature: 28, condition: 'heavy_rain', conditionLabel: 'Heavy Rain', humidity: 89, windSpeed: 24, rainProbability: 85 },
  hourly: [
    { hour: '14:00', temp: 28, rain: 85, condition: 'heavy_rain' },
    { hour: '16:00', temp: 26, rain: 92, condition: 'thunderstorm' },
    { hour: '18:00', temp: 24, rain: 80, condition: 'heavy_rain' },
    { hour: '20:00', temp: 23, rain: 55, condition: 'light_rain' },
    { hour: '22:00', temp: 22, rain: 35, condition: 'cloudy' },
    { hour: '00:00', temp: 21, rain: 20, condition: 'partly_cloudy' },
  ],
  warnings: [
    { id: 'w1', severity: 'severe', title: 'Flash Flood Warning', icon: '🌊' },
    { id: 'w2', severity: 'warning', title: 'Thunderstorm Warning', icon: '⛈️' },
  ],
  regionalRisk: { score: 72, level: 'HIGH', color: 'text-red-400' },
};

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  severe: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  advisory: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  normal: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const WeatherIntelligencePanel: React.FC = () => {
  const w = mockAdminWeather;
  const riskCfg = w.regionalRisk;

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <span className="text-base">🌦️</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">Weather Intelligence</h3>
            <p className="text-2xs text-slate-500">Mock data — Islamabad Capital Territory</p>
          </div>
        </div>
        <span className="text-2xs font-semibold text-slate-500 px-2 py-1 rounded-lg bg-white/[0.03] border border-glass">
          MOCK
        </span>
      </div>

      {/* Current Weather */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-white/[0.02] border border-glass">
        <div className="text-center">
          <span className="text-3xl">{weatherIcons[w.current.condition] || '🌤️'}</span>
          <p className="text-xl font-black font-display text-white mt-1">{w.current.temperature}°C</p>
          <p className="text-2xs text-slate-400">{w.current.conditionLabel}</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 ml-2">
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-2xs text-slate-500">Rain</p>
            <p className="text-xs font-bold text-sky-400">{w.current.rainProbability}%</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-2xs text-slate-500">Humidity</p>
            <p className="text-xs font-bold text-blue-400">{w.current.humidity}%</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-2xs text-slate-500">Wind</p>
            <p className="text-xs font-bold text-cyan-400">{w.current.windSpeed} km/h</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-2xs text-slate-500">Risk Level</p>
            <p className={`text-xs font-bold ${riskCfg.color}`}>{riskCfg.level} ({riskCfg.score})</p>
          </div>
        </div>
      </div>

      {/* 6-Hour Forecast Strip */}
      <div className="mb-4">
        <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Forecast (6h)</p>
        <div className="grid grid-cols-6 gap-1.5">
          {w.hourly.map((h, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-white/[0.02] border border-glass">
              <p className="text-2xs text-slate-500 mb-1">{h.hour}</p>
              <p className="text-sm">{weatherIcons[h.condition] || '🌤️'}</p>
              <p className="text-xs font-bold text-slate-200 mt-1">{h.temp}°</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <span className="text-[8px]">💧</span>
                <span className="text-2xs text-sky-400 font-semibold">{h.rain}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Warnings */}
      {w.warnings.length > 0 && (
        <div>
          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Warnings</p>
          <div className="space-y-2">
            {w.warnings.map((warning) => {
              const sev = severityColors[warning.severity] || severityColors.normal;
              return (
                <div key={warning.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${sev.bg} border ${sev.border}`}>
                  <span className="text-base">{warning.icon}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${sev.text}`}>{warning.title}</p>
                    <p className="text-2xs text-slate-400">Severity: {warning.severity.toUpperCase()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regional Risk Summary */}
      <div className="mt-4 pt-3 border-t border-glass flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs">🛡️</span>
          <span className="text-2xs text-slate-500">Regional Risk Assessment</span>
        </div>
        <span className={`text-xs font-bold ${riskCfg.color}`}>
          {riskCfg.level} RISK — Score {riskCfg.score}/100
        </span>
      </div>
    </div>
  );
};

// ─── Clock Hook ─────────────────────────────────────────────

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ─── Main Dashboard Page ────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const [mapLayer, setMapLayer] = useState(true);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const clock = useClock();

  // Check API connection on mount
  useEffect(() => {
    api.isConnected()
      .then((connected) => setApiConnected(connected))
      .catch(() => setApiConnected(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── API Connection Banner ──────────────────────── */}
      {apiConnected === false && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-400">Using Mock Data</p>
            <p className="text-2xs text-slate-400">Backend API is not connected. Deploy the backend on Render.com and set <code className="text-sky-400 font-mono">VITE_API_URL</code> in Vercel env vars.</p>
          </div>
          <span className="text-2xs font-semibold text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">MOCK</span>
        </div>
      )}
      {apiConnected === true && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-lg">✅</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-emerald-400">Backend Connected</p>
            <p className="text-2xs text-slate-400">Live data from ReliefLink API</p>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </div>
      )}
      {/* ─── Live Metrics Strip ─────────────────────────── */}
      <LiveMetricsBar metrics={liveMetrics} />

      {/* ─── Top Stats Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Active Emergencies"
          value={12}
          icon={iconSvg.alert}
          accent="danger"
          glow
          change={{ value: '+3 in 1hr', direction: 'up', positive: false }}
        />
        <StatsCard
          label="People Needing Help"
          value={'2,847'}
          icon={iconSvg.people}
          accent="warning"
          change={{ value: '+420', direction: 'up', positive: false }}
        />
        <StatsCard
          label="High-Risk Areas"
          value={7}
          icon={iconSvg.map}
          accent="info"
          change={{ value: '+2 today', direction: 'up', positive: false }}
        />
        <StatsCard
          label="Available Rescue Teams"
          value={'8/12'}
          icon={iconSvg.team}
          accent="success"
          glow
          change={{ value: '67%', direction: 'up', positive: true }}
        />
      </div>

      {/* ─── Main Content: Map + Right Panel ────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* ─── Interactive Command Map ─────────────────── */}
        <div className="space-y-4">
          <CommandMap height="520px">
            {/* Heatmap / disaster zones */}
            <HeatmapZone x="38%" y="45%" width="180px" height="140px" color="#EF4444" opacity={0.12} />
            <HeatmapZone x="55%" y="38%" width="120px" height="100px" color="#F59E0B" opacity={0.1} />
            <HeatmapZone x="62%" y="65%" width="100px" height="80px" color="#F97316" opacity={0.1} />
            <HeatmapZone x="28%" y="72%" width="140px" height="100px" color="#3B82F6" opacity={0.08} />

            {/* Risk zone pins */}
            <RiskZonePin x="38%" y="42%" severity="critical" label="Nullah Lei Flood Zone" />
            <RiskZonePin x="55%" y="35%" severity="high" label="F-10 Building Collapse" />
            <RiskZonePin x="62%" y="62%" severity="high" label="I-8 Fire Emergency" />
            <RiskZonePin x="28%" y="28%" severity="medium" label="Margalla Landslide Risk" />
            <RiskZonePin x="48%" y="58%" severity="medium" label="Rawal Dam Overflow Zone" />
            <RiskZonePin x="70%" y="45%" severity="low" label="G-10 Waterlogging" />

            {/* SOS request pins */}
            <SOSPin x="38%" y="45%" label="SOS-4821 — Fatima Bibi" />
            <SOSPin x="42%" y="52%" label="SOS-4819 — Ahmed Raza" />
            <SOSPin x="55%" y="38%" label="SOS-4817 — Saira Bano" />
            <SOSPin x="62%" y="65%" label="SOS-4815 — Usman Ali" />

            {/* Shelter pins (green) */}
            <div className="absolute z-10" style={{ left: '45%', top: '70%', transform: 'translate(-50%,-50%)' }}>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <span className="text-xs">🏥</span>
              </div>
            </div>
            <div className="absolute z-10" style={{ left: '32%', top: '55%', transform: 'translate(-50%,-50%)' }}>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <span className="text-xs">🕌</span>
              </div>
            </div>
            <div className="absolute z-10" style={{ left: '68%', top: '50%', transform: 'translate(-50%,-50%)' }}>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <span className="text-xs">🏫</span>
              </div>
            </div>

            {/* Hospital pins */}
            <div className="absolute z-10" style={{ left: '75%', top: '35%', transform: 'translate(-50%,-50%)' }}>
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border-2 border-sky-500/50 flex items-center justify-center">
                <span className="text-xs">🏨</span>
              </div>
            </div>

            {/* Blocked road indicators */}
            <div className="absolute z-10" style={{ left: '50%', top: '48%', transform: 'translate(-50%,-50%)' }}>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-900/40 border border-red-500/30">
                <span className="text-2xs">🚧</span>
                <span className="text-2xs text-red-300 font-medium whitespace-nowrap">Road Blocked</span>
              </div>
            </div>

            {/* Rescue team indicators */}
            <div className="absolute z-10 animate-float" style={{ left: '40%', top: '50%', transform: 'translate(-50%,-50%)' }}>
              <div className="w-7 h-7 rounded-full bg-indigo-500/30 border-2 border-indigo-400/50 flex items-center justify-center shadow-glow-primary">
                <span className="text-xs">🚑</span>
              </div>
            </div>
            <div className="absolute z-10 animate-float" style={{ left: '58%', top: '40%', transform: 'translate(-50%,-50%)', animationDelay: '1s' }}>
              <div className="w-7 h-7 rounded-full bg-indigo-500/30 border-2 border-indigo-400/50 flex items-center justify-center shadow-glow-primary">
                <span className="text-xs">🚒</span>
              </div>
            </div>

            {/* Map legend */}
            <MapLegend
              title="Map Legend"
              items={[
                { color: '#EF4444', label: 'SOS Requests', count: 4 },
                { color: '#F59E0B', label: 'High-Risk Zones', count: 6 },
                { color: '#22C55E', label: 'Shelters', count: 3 },
                { color: '#0EA5E9', label: 'Hospitals', count: 1 },
                { color: '#6366F1', label: 'Rescue Teams', count: 2 },
                { color: '#991B1B', label: 'Blocked Roads', count: 1 },
              ]}
            />

            {/* Toolbar */}
            <MapToolbar>
              <MapToolbarButton icon={iconSvg.layers} label="Toggle Layers" active={mapLayer} onClick={() => setMapLayer(!mapLayer)} />
              <MapToolbarButton icon={iconSvg.zoomIn} label="Zoom In" />
              <MapToolbarButton icon={iconSvg.zoomOut} label="Zoom Out" />
              <MapToolbarButton icon={iconSvg.locate} label="Center Map" />
            </MapToolbar>

            {/* Top-left info badge */}
            <div className="absolute top-4 left-4 map-overlay-panel flex items-center gap-3 !p-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-red-400 opacity-60 animate-ping" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-red-400" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">Islamabad Capital Territory</p>
                <p className="text-2xs text-slate-400">Flash Flood Active · {clock} PKT</p>
              </div>
            </div>
          </CommandMap>

          {/* ─── Bottom quick stats row ──────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'SOS Today', value: '47', color: 'text-rose-400', icon: '🆘' },
              { label: 'Resolved', value: '35', color: 'text-emerald-400', icon: '✅' },
              { label: 'Avg ETA', value: '6.2 min', color: 'text-amber-400', icon: '⏱️' },
              { label: 'Shelter Capacity', value: '67%', color: 'text-blue-400', icon: '🏥' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-3 flex items-center gap-3">
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <p className={`text-lg font-bold font-display ${stat.color}`}>{stat.value}</p>
                  <p className="text-2xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right Panel ────────────────────────────── */}
        <div className="space-y-5">
          {/* Live Emergency Feed */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-display">Live Emergency Feed</h3>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-rose-400 opacity-60 animate-ping" />
                  <span className="relative rounded-full h-2 w-2 bg-rose-400" />
                </span>
              </div>
              <span className="text-2xs text-slate-500 font-mono">{mockSOSRequests.length} requests</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-4">
              {['All', 'New', 'Active', 'Resolved'].map((tab, i) => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all border
                    ${i === 0
                      ? 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                      : 'text-slate-500 border-glass hover:text-slate-300 hover:border-glass-hover'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Feed cards */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {mockSOSRequests.map((req, i) => (
                <FeedCard key={req.id} req={req} index={i} />
              ))}
            </div>
          </div>

          {/* AI Risk Intelligence */}
          <AIRiskPanel />

          {/* Weather Intelligence */}
          <WeatherIntelligencePanel />
        </div>
      </div>
    </div>
  );
};
