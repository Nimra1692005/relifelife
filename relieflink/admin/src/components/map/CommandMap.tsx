import React from 'react';

/* ─── Command Map Container ─────────────────────────────── */

interface CommandMapProps {
  children?: React.ReactNode;
  height?: string;
  className?: string;
}

export const CommandMap: React.FC<CommandMapProps> = ({
  children,
  height = '100%',
  className = '',
}) => (
  <div
    className={`relative rounded-2xl overflow-hidden border border-glass ${className}`}
    style={{ height }}
  >
    {/* Dark map placeholder — replace with react-leaflet / mapbox */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse at 40% 30%, rgba(40,82,255,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 65% 60%, rgba(239,68,68,0.06) 0%, transparent 40%),
          radial-gradient(ellipse at 30% 70%, rgba(34,197,94,0.05) 0%, transparent 40%),
          linear-gradient(180deg, #080D18 0%, #0A1020 100%)
        `,
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Pakistan outline placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-32 h-32 mx-auto text-slate-700/30"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M100 20 L140 40 L170 70 L160 110 L140 140 L120 160 L100 170 L80 160 L50 130 L40 100 L50 70 L70 40 Z" />
          </svg>
          <p className="text-2xs text-slate-600 mt-2 font-medium uppercase tracking-widest">
            Pakistan Region
          </p>
        </div>
      </div>

      {/* Floating controls and overlays */}
      {children}
    </div>
  </div>
);

/* ─── Map Legend ─────────────────────────────────────────── */

interface LegendItem {
  color: string;
  label: string;
  count?: number;
}

interface MapLegendProps {
  items: LegendItem[];
  title?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  items,
  title = 'Legend',
}) => (
  <div className="map-overlay-panel absolute bottom-4 left-4 min-w-[180px]">
    <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
      {title}
    </p>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div
            className="map-legend-dot"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-slate-300 flex-1">{item.label}</span>
          {item.count !== undefined && (
            <span className="text-2xs text-slate-500 font-mono">{item.count}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ─── Map Floating Toolbar ──────────────────────────────── */

interface MapToolbarProps {
  children: React.ReactNode;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({ children }) => (
  <div className="absolute top-4 right-4 flex flex-col gap-2">
    {children}
  </div>
);

interface MapToolbarButtonProps {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}

export const MapToolbarButton: React.FC<MapToolbarButtonProps> = ({
  icon,
  label,
  active = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`
      w-10 h-10 rounded-xl flex items-center justify-center
      transition-all duration-normal border
      ${active
        ? 'bg-brand-500/20 text-brand-300 border-brand-500/30 shadow-glow-primary'
        : 'glass-surface text-slate-400 hover:text-slate-200 hover:border-glass-hover'
      }
    `}
  >
    {icon}
  </button>
);

/* ─── Risk Zone Overlay (visual indicator) ──────────────── */

interface RiskZonePinProps {
  x: string;
  y: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  label?: string;
}

const pinColors = {
  low: { bg: 'bg-lime-500', ring: 'ring-lime-500/30', glow: '0 0 15px rgba(132,204,22,0.4)' },
  medium: { bg: 'bg-amber-500', ring: 'ring-amber-500/30', glow: '0 0 15px rgba(245,158,11,0.4)' },
  high: { bg: 'bg-red-500', ring: 'ring-red-500/30', glow: '0 0 20px rgba(239,68,68,0.5)' },
  critical: { bg: 'bg-rose-500', ring: 'ring-rose-500/30', glow: '0 0 25px rgba(244,63,94,0.6)' },
};

export const RiskZonePin: React.FC<RiskZonePinProps> = ({
  x,
  y,
  severity,
  label,
}) => {
  const c = pinColors[severity];
  return (
    <div
      className="absolute z-10 group"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {/* Pulse ring */}
      <div
        className={`absolute inset-0 rounded-full ${c.bg} opacity-30
                   animate-pulse-ring`}
        style={{ width: 28, height: 28, margin: '-7px' }}
      />
      {/* Pin */}
      <div
        className={`w-3.5 h-3.5 rounded-full ${c.bg} ring-4 ${c.ring}
                   cursor-pointer transition-transform hover:scale-125`}
        style={{ boxShadow: c.glow }}
      />
      {/* Tooltip */}
      {label && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        opacity-0 group-hover:opacity-100 transition-opacity
                        pointer-events-none whitespace-nowrap">
          <div className="tooltip">{label}</div>
        </div>
      )}
    </div>
  );
};

/* ─── SOS Pin ───────────────────────────────────────────── */

interface SOSPinProps {
  x: string;
  y: string;
  label?: string;
}

export const SOSPin: React.FC<SOSPinProps> = ({ x, y, label }) => (
  <div
    className="absolute z-20"
    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
  >
    {/* Outer pulse */}
    <div className="absolute -inset-3 rounded-full bg-red-500/20 animate-pulse-ring" />
    {/* Inner pulse */}
    <div className="absolute -inset-1.5 rounded-full bg-red-500/40 animate-pulse-sos" />
    {/* Pin */}
    <div className="relative w-4 h-4 rounded-full bg-red-500 border-2 border-white/30
                    shadow-glow-sos cursor-pointer hover:scale-110 transition-transform">
      <span className="absolute inset-0 flex items-center justify-center
                       text-white text-2xs font-black" style={{ fontSize: '6px' }}>
        SOS
      </span>
    </div>
    {label && (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        <div className="tooltip text-red-300">{label}</div>
      </div>
    )}
  </div>
);

/* ─── Heatmap Overlay ───────────────────────────────────── */

interface HeatmapZoneProps {
  x: string;
  y: string;
  width: string;
  height: string;
  color: string;
  opacity?: number;
}

export const HeatmapZone: React.FC<HeatmapZoneProps> = ({
  x,
  y,
  width,
  height,
  color,
  opacity = 0.15,
}) => (
  <div
    className="absolute rounded-full blur-2xl pointer-events-none"
    style={{
      left: x,
      top: y,
      width,
      height,
      backgroundColor: color,
      opacity,
      transform: 'translate(-50%, -50%)',
    }}
  />
);
