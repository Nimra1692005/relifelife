/**
 * ReliefLink — SOS Emergency API Service
 *
 * Simulates backend API calls with realistic delays.
 * Replace with real HTTP calls when backend is connected.
 */

// ─── Types ──────────────────────────────────────────────

export type EmergencyType =
  | 'flood'
  | 'fire'
  | 'medical'
  | 'earthquake'
  | 'landslide'
  | 'security'
  | 'other';

export type TrackingPhase =
  | 'received'
  | 'notified'
  | 'assigned'
  | 'en_route'
  | 'arrived';

export interface SOSPayload {
  user_id: string;
  emergency_type: EmergencyType;
  latitude: number;
  longitude: number;
  address: string;
  message: string;
  timestamp: string;
  status: 'pending';
}

export interface SOSRequestResponse {
  id: string;
  user_id: string;
  emergency_type: EmergencyType;
  latitude: number;
  longitude: number;
  address: string;
  message: string;
  status: 'pending' | 'acknowledged' | 'dispatched' | 'in_progress' | 'resolved';
  priority: 'critical' | 'high' | 'medium';
  tracking_phases: TrackingPhaseStatus[];
  estimated_eta_minutes: number;
  created_at: string;
}

export interface TrackingPhaseStatus {
  phase: TrackingPhase;
  label: string;
  status: 'completed' | 'active' | 'pending';
  timestamp: string | null;
  detail?: string;
}

// ─── Emergency Type Config ─────────────────────────────

export interface EmergencyTypeInfo {
  id: EmergencyType;
  label: string;
  icon: string;
  color: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium';
}

export const EMERGENCY_TYPES: EmergencyTypeInfo[] = [
  {
    id: 'flood',
    label: 'Flood',
    icon: '🌊',
    color: '#3B82F6',
    description: 'Rising water, flash flood, or submersion',
    urgency: 'high',
  },
  {
    id: 'fire',
    label: 'Fire',
    icon: '🔥',
    color: '#F97316',
    description: 'Building fire, wildfire, or explosion',
    urgency: 'critical',
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    icon: '🏥',
    color: '#EF4444',
    description: 'Injury, illness, or life-threatening condition',
    urgency: 'critical',
  },
  {
    id: 'earthquake',
    label: 'Earthquake',
    icon: '🏚️',
    color: '#A855F7',
    description: 'Seismic activity, building collapse, or aftershock',
    urgency: 'critical',
  },
  {
    id: 'landslide',
    label: 'Landslide',
    icon: '⛰️',
    color: '#A3825A',
    description: 'Mudslide, rock fall, or terrain collapse',
    urgency: 'high',
  },
  {
    id: 'security',
    label: 'Security Emergency',
    icon: '🛡️',
    color: '#6366F1',
    description: 'Threat, attack, or unsafe situation',
    urgency: 'critical',
  },
  {
    id: 'other',
    label: 'Other',
    icon: '⚠️',
    color: '#F59E0B',
    description: 'Any other emergency situation',
    urgency: 'high',
  },
];

// ─── Simulated Location ────────────────────────────────

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number; // meters
  timestamp: string;
}

export async function captureLocation(): Promise<CapturedLocation> {
  // Simulate GPS lock with realistic delay (800ms – 2s)
  const delay = 800 + Math.random() * 1200;
  await new Promise((r) => setTimeout(r, delay));

  return {
    latitude: 33.6844 + (Math.random() - 0.5) * 0.001,
    longitude: 73.0479 + (Math.random() - 0.5) * 0.001,
    address: 'Sector G-11/2, Islamabad',
    accuracy: Math.round(5 + Math.random() * 15),
    timestamp: new Date().toISOString(),
  };
}

// ─── API Call: Submit SOS ──────────────────────────────

/**
 * Submit an SOS request to the backend.
 * Currently simulated — replace with real HTTP POST to /api/v1/sos
 */
export async function submitSOSRequest(
  payload: SOSPayload
): Promise<SOSRequestResponse> {
  // Simulate network latency (1s – 2.5s)
  const delay = 1000 + Math.random() * 1500;
  await new Promise((r) => setTimeout(r, delay));

  // Simulate 5% failure rate for testing error states
  if (Math.random() < 0.05) {
    throw new Error(
      'Network error: Unable to reach emergency services. Please try again.'
    );
  }

  const requestId = `SOS-${new Date().getFullYear()}-${String(
    Math.floor(1000 + Math.random() * 9000)
  )}`;

  const now = new Date();
  const typeInfo = EMERGENCY_TYPES.find((t) => t.id === payload.emergency_type);

  return {
    id: requestId,
    user_id: payload.user_id,
    emergency_type: payload.emergency_type,
    latitude: payload.latitude,
    longitude: payload.longitude,
    address: payload.address,
    message: payload.message,
    status: 'pending',
    priority: typeInfo?.urgency || 'high',
    estimated_eta_minutes: 8 + Math.floor(Math.random() * 14),
    created_at: now.toISOString(),
    tracking_phases: [
      {
        phase: 'received',
        label: 'Request Received',
        status: 'completed',
        timestamp: now.toISOString(),
        detail: 'Your emergency request has been logged',
      },
      {
        phase: 'notified',
        label: 'Rescue Team Notified',
        status: 'active',
        timestamp: null,
        detail: null,
      },
      {
        phase: 'assigned',
        label: 'Team Assigned',
        status: 'pending',
        timestamp: null,
        detail: null,
      },
      {
        phase: 'en_route',
        label: 'Help On The Way',
        status: 'pending',
        timestamp: null,
        detail: null,
      },
      {
        phase: 'arrived',
        label: 'Help Arrived',
        status: 'pending',
        timestamp: null,
        detail: null,
      },
    ],
  };
}

// ─── Simulated Tracking Progression ────────────────────

/**
 * Simulates tracking phases advancing over time.
 * In production, replace with WebSocket / Supabase Realtime subscription.
 */
export function createTrackingSimulator(
  initialResponse: SOSRequestResponse,
  onPhaseUpdate: (updated: SOSRequestResponse) => void
): { stop: () => void } {
  const phases: TrackingPhase[] = [
    'received',
    'notified',
    'assigned',
    'en_route',
    'arrived',
  ];

  let currentPhaseIndex = 1; // 'received' is already completed
  let stopped = false;

  const phaseDetails: Record<TrackingPhase, string> = {
    received: 'Your emergency request has been logged',
    notified: 'Nearby rescue teams have been alerted',
    assigned: 'Rescue Unit Alpha-7 assigned to your case',
    en_route: 'Team is heading to your location',
    arrived: 'Rescue team has arrived at your location',
  };

  const advancePhase = () => {
    if (stopped || currentPhaseIndex >= phases.length) return;

    const targetPhase = phases[currentPhaseIndex];
    const updated = { ...initialResponse };

    updated.tracking_phases = updated.tracking_phases.map((tp) => {
      if (tp.phase === targetPhase) {
        return {
          ...tp,
          status: 'completed' as const,
          timestamp: new Date().toISOString(),
          detail: phaseDetails[targetPhase],
        };
      }
      if (
        currentPhaseIndex + 1 < phases.length &&
        tp.phase === phases[currentPhaseIndex + 1]
      ) {
        return { ...tp, status: 'active' as const };
      }
      return tp;
    });

    // Update overall status
    if (currentPhaseIndex >= phases.length - 1) {
      updated.status = 'resolved';
    } else if (currentPhaseIndex >= 2) {
      updated.status = 'in_progress';
    } else {
      updated.status = 'acknowledged';
    }

    initialResponse = updated;
    currentPhaseIndex++;
    onPhaseUpdate(updated);

    // Schedule next phase (3-6 seconds apart for demo)
    if (currentPhaseIndex < phases.length && !stopped) {
      const nextDelay = 3000 + Math.random() * 3000;
      setTimeout(advancePhase, nextDelay);
    }
  };

  // Start first advancement after 2-4 seconds
  const initialDelay = 2000 + Math.random() * 2000;
  const timer = setTimeout(advancePhase, initialDelay);

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
    },
  };
}
