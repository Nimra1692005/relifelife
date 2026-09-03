import React from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

/* ─── Alert Composer ────────────────────────────────────── */

interface AlertComposerProps {
  onSend?: (alert: {
    title: string;
    severity: string;
    disasterType: string;
    message: string;
  }) => void;
  onCancel?: () => void;
}

export const AlertComposer: React.FC<AlertComposerProps> = ({
  onSend,
  onCancel,
}) => {
  const [title, setTitle] = React.useState('');
  const [severity, setSeverity] = React.useState('');
  const [disasterType, setDisasterType] = React.useState('');
  const [message, setMessage] = React.useState('');

  const severityOptions = [
    { value: 'low', label: 'Low — Awareness' },
    { value: 'medium', label: 'Medium — Caution' },
    { value: 'high', label: 'High — Warning' },
    { value: 'critical', label: 'Critical — Immediate Action' },
  ];

  const disasterOptions = [
    { value: 'flood', label: '🌊 Flood' },
    { value: 'earthquake', label: '🫨 Earthquake' },
    { value: 'fire', label: '🔥 Fire' },
    { value: 'landslide', label: '⛰️ Landslide' },
    { value: 'storm', label: '🌪️ Storm' },
    { value: 'extreme_rain', label: '🌧️ Extreme Rain' },
  ];

  return (
    <div className="space-y-5">
      {/* Disaster Type */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Disaster Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {disasterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDisasterType(opt.value)}
              className={`
                px-3 py-2.5 rounded-xl text-xs font-medium
                border transition-all duration-normal
                ${disasterType === opt.value
                  ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                  : 'bg-white/[0.03] text-slate-400 border-glass hover:border-glass-hover hover:text-slate-300'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Alert Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Flash Flood Warning — Sindh Region"
          className="input-field"
        />
      </div>

      {/* Severity */}
      <Select
        label="Severity Level"
        options={severityOptions}
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        placeholder="Select severity..."
      />

      {/* Message */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Alert Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the emergency, affected areas, and recommended actions..."
          rows={4}
          className="input-field resize-none"
        />
        <p className="text-2xs text-slate-500">
          This message will be pushed to all citizens in the affected area via
          real-time notification.
        </p>
      </div>

      {/* Preview */}
      {title && severity && (
        <div className="glass-surface rounded-xl p-4 space-y-2">
          <p className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">
            Preview
          </p>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center
                            justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{title}</p>
              {message && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          }
          onClick={() => onSend?.({ title, severity, disasterType, message })}
          disabled={!title || !severity || !disasterType}
        >
          Broadcast Alert
        </Button>
      </div>
    </div>
  );
};

/* ─── Alert History Row ─────────────────────────────────── */

interface AlertHistoryRowProps {
  title: string;
  disasterType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: number;
  time: string;
  status: 'active' | 'resolved' | 'expired';
}

const sevBorder: Record<string, string> = {
  low: 'severity-border-low',
  medium: 'severity-border-medium',
  high: 'severity-border-high',
  critical: 'severity-border-critical',
};

export const AlertHistoryRow: React.FC<AlertHistoryRowProps> = ({
  title,
  disasterType,
  severity,
  recipients,
  time,
  status,
}) => (
  <div className={`glass-card p-4 ${sevBorder[severity]}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-2xs text-slate-500 mt-0.5">
          {disasterType} • {recipients.toLocaleString()} recipients • {time}
        </p>
      </div>
      <span
        className={`status-pill ${
          status === 'active'
            ? 'status-safe'
            : status === 'resolved'
              ? 'status-medium'
              : 'bg-slate-500/10 text-slate-500 border-slate-500/15'
        }`}
      >
        {status}
      </span>
    </div>
  </div>
);
