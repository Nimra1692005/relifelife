/**
 * ReliefLink — Shared Disaster Type Definitions
 */

export type DisasterType =
  | 'flood'
  | 'earthquake'
  | 'fire'
  | 'landslide'
  | 'storm'
  | 'extreme_rain';

export type SeverityLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'resolved' | 'expired';

export type SOSStatus =
  | 'pending'
  | 'acknowledged'
  | 'dispatched'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

export type SOSUrgency = 'low' | 'medium' | 'high' | 'critical';

export type TeamStatus = 'available' | 'deployed' | 'on_break' | 'offline';

export type TeamType =
  | 'medical'
  | 'search_rescue'
  | 'fire'
  | 'logistics'
  | 'volunteer';

export type UserRole = 'citizen' | 'rescuer' | 'admin' | 'volunteer';

export type ShelterType =
  | 'shelter'
  | 'hospital'
  | 'relief_camp'
  | 'mosque'
  | 'school';

export type ShelterStatus = 'active' | 'full' | 'closed';

export type SupportedLanguage = 'en' | 'ur' | 'roman_ur';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface DisasterAlert {
  id: string;
  disaster_type: DisasterType;
  severity: SeverityLevel;
  title: string;
  description: string;
  affected_area: GeoPolygon;
  center_point: GeoPoint;
  radius_km: number;
  issued_by: string;
  status: AlertStatus;
  created_at: string;
  expires_at: string;
}

export interface SOSRequest {
  id: string;
  user_id: string;
  location: GeoPoint;
  address_text: string;
  disaster_type: string;
  urgency: SOSUrgency;
  message: string;
  status: SOSStatus;
  assigned_team?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Shelter {
  id: string;
  name: string;
  type: ShelterType;
  location: GeoPoint;
  address: string;
  capacity: number;
  current_occupancy: number;
  facilities: string[];
  status: ShelterStatus;
  contact_phone: string;
  managed_by: string;
  verified: boolean;
  created_at: string;
}

export interface RescueTeam {
  id: string;
  team_name: string;
  leader_id: string;
  team_type: TeamType;
  status: TeamStatus;
  current_location?: GeoPoint;
  members_count: number;
  contact_radio: string;
  created_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  skills: string[];
  availability: 'available' | 'deployed' | 'unavailable';
  verified: boolean;
  registered_at: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: SupportedLanguage;
  timestamp: string;
  actions?: AIAction[];
}

export interface AIAction {
  type: 'sos' | 'shelter' | 'route' | 'alert' | 'info';
  label: string;
  payload: Record<string, unknown>;
}
