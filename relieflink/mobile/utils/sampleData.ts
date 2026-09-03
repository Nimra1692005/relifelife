/**
 * ReliefLink Mobile — Realistic Sample / Mock Data
 * Used for UI development before backend integration
 */

export const mockUser = {
  id: 'u_001',
  full_name: 'Ahmed Khan',
  phone: '+92 300 1234567',
  email: 'ahmed.khan@email.com',
  avatar: null,
  blood_group: 'O+',
  emergency_contact: '+92 321 9876543',
  language_pref: 'en' as const,
  role: 'citizen' as const,
};

export const mockLocation = {
  latitude: 33.6844,
  longitude: 73.0479,
  address: 'Sector G-11, Islamabad',
  city: 'Islamabad',
  province: 'Islamabad Capital Territory',
};

export const mockSafetyStatus = {
  score: 72,
  level: 'medium' as const, // safe | low | medium | high | critical
  label: 'Moderate Risk',
  description: 'Moderate flood risk in your area due to recent heavy rainfall in upstream regions. Stay alert and monitor alerts.',
  lastUpdated: '2 min ago',
  riskFactors: [
    { type: 'flood', level: 'medium', label: 'Flood Risk' },
    { type: 'landslide', level: 'low', label: 'Landslide Risk' },
    { type: 'storm', level: 'low', label: 'Storm Risk' },
  ],
};

export const mockAlerts = [
  {
    id: 'a_001',
    disasterType: 'flood' as const,
    severity: 'high' as const,
    title: 'Flash Flood Warning — Rawal Dam Overflow Risk',
    location: 'Rawal Dam Area, Islamabad',
    time: '15 min ago',
    distance: '4.2 km',
    description:
      'Water levels at Rawal Dam have exceeded safe thresholds. Downstream areas including sectors E-11, F-11, and G-11 may experience flash flooding within the next 2 hours.',
  },
  {
    id: 'a_002',
    disasterType: 'extreme_rain' as const,
    severity: 'medium' as const,
    title: 'Heavy Rainfall Advisory — Islamabad & Rawalpindi',
    location: 'Islamabad / Rawalpindi Region',
    time: '1 hour ago',
    distance: '0 km',
    description:
      'PMD has issued a heavy rainfall advisory. Expected 80-120mm rainfall in the next 24 hours. Low-lying areas advised to prepare.',
  },
  {
    id: 'a_003',
    disasterType: 'landslide' as const,
    severity: 'medium' as const,
    title: 'Landslide Warning — Margalla Hills Trails',
    location: 'Margalla Hills, Islamabad',
    time: '3 hours ago',
    distance: '6.8 km',
    description:
      'Trail 3, Trail 5, and Pir Sohawa road at risk of landslides due to saturated soil. Public advised to avoid hiking trails.',
  },
  {
    id: 'a_004',
    disasterType: 'storm' as const,
    severity: 'low' as const,
    title: 'Thunderstorm Advisory — Evening Hours',
    location: 'Wider Islamabad Region',
    time: '5 hours ago',
    distance: '0 km',
    description:
      'Isolated thunderstorms expected between 5 PM – 9 PM. Wind gusts up to 60 km/h possible. Secure outdoor objects.',
  },
];

export const mockShelters = [
  {
    id: 's_001',
    name: 'F-11 Community Center Shelter',
    type: 'relief_camp' as const,
    address: 'Street 15, F-11/2, Islamabad',
    distance: '1.2 km',
    travelTime: '5 min drive',
    capacity: 500,
    currentOccupancy: 234,
    facilities: ['Food', 'Water', 'Medical Aid', 'Blankets'],
    status: 'active' as const,
    verified: true,
    phone: '+92 51 2345678',
    lat: 33.6998,
    lng: 73.0125,
  },
  {
    id: 's_002',
    name: 'Al-Shifa Mosque Emergency Center',
    type: 'mosque' as const,
    address: 'Main Boulevard, G-11/3, Islamabad',
    distance: '0.8 km',
    travelTime: '3 min walk',
    capacity: 200,
    currentOccupancy: 87,
    facilities: ['Shelter', 'Water', 'First Aid'],
    status: 'active' as const,
    verified: true,
    phone: '+92 51 8765432',
    lat: 33.6812,
    lng: 73.0390,
  },
  {
    id: 's_003',
    name: 'Government Girls School Shelter',
    type: 'school' as const,
    address: 'Sector G-11/1, Islamabad',
    distance: '1.8 km',
    travelTime: '8 min drive',
    capacity: 800,
    currentOccupancy: 412,
    facilities: ['Food', 'Water', 'Electricity', 'Medical Aid', 'Blankets'],
    status: 'active' as const,
    verified: true,
    phone: '+92 51 1122334',
    lat: 33.7025,
    lng: 73.0288,
  },
  {
    id: 's_004',
    name: 'Edhi Foundation Center',
    type: 'shelter' as const,
    address: 'Jinnah Avenue, G-10/4, Islamabad',
    distance: '3.1 km',
    travelTime: '12 min drive',
    capacity: 300,
    currentOccupancy: 156,
    facilities: ['Food', 'Water', 'Medical Aid', 'Transport'],
    status: 'active' as const,
    verified: true,
    phone: '+92 51 5566778',
    lat: 33.6950,
    lng: 73.0500,
  },
];

export const mockHospitals = [
  {
    id: 'h_001',
    name: 'PIMS Hospital',
    address: 'Sector G-8/3, Islamabad',
    distance: '4.5 km',
    travelTime: '15 min drive',
    emergencyPhone: '1166',
    available: true,
    lat: 33.7145,
    lng: 73.0510,
  },
  {
    id: 'h_002',
    name: 'Shifa International Hospital',
    address: 'Sector H-8/4, Islamabad',
    distance: '5.8 km',
    travelTime: '20 min drive',
    emergencyPhone: '+92 51 8184100',
    available: true,
    lat: 33.7100,
    lng: 73.0650,
  },
  {
    id: 'h_003',
    name: 'Capital Hospital',
    address: 'Sector G-6/2, Islamabad',
    distance: '6.2 km',
    travelTime: '22 min drive',
    emergencyPhone: '+92 51 9208020',
    available: true,
    lat: 33.7210,
    lng: 73.0780,
  },
];

export const mockNotifications = [
  {
    id: 'n_001',
    type: 'alert' as const,
    title: 'Flash Flood Warning',
    body: 'High flood risk in your area. Check safe routes immediately.',
    time: '15 min ago',
    read: false,
  },
  {
    id: 'n_002',
    type: 'system' as const,
    title: 'Safety Check',
    body: 'Are you safe? Tap to confirm your status.',
    time: '30 min ago',
    read: false,
  },
  {
    id: 'n_003',
    type: 'alert' as const,
    title: 'Heavy Rain Advisory',
    body: 'PMD expects 80-120mm rainfall in the next 24 hours.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: 'n_004',
    type: 'sos_update' as const,
    title: 'SOS Request Updated',
    body: 'A rescue team has been dispatched to your area.',
    time: '2 hours ago',
    read: true,
  },
  {
    id: 'n_005',
    type: 'system' as const,
    title: 'Shelter Available',
    body: 'F-11 Community Center now accepting evacuees. 266 spots available.',
    time: '3 hours ago',
    read: true,
  },
];

export const mockEmergencyContacts = [
  { name: 'Rescue 1122', number: '1122', icon: 'ambulance' },
  { name: 'Police Helpline', number: '15', icon: 'police' },
  { name: 'Fire Brigade', number: '16', icon: 'fire' },
  { name: 'Edhi Foundation', number: '115', icon: 'aid' },
  { name: 'NDMA Helpline', number: '111-157-157', icon: 'government' },
  { name: 'Personal Emergency', number: '+92 321 9876543', icon: 'person' },
];

export const mockOnboardingSlides = [
  {
    id: 1,
    title: 'Stay Safe, Stay Connected',
    subtitle:
      'Real-time disaster alerts and safety information for every citizen of Pakistan.',
    emoji: '🛡️',
    gradient: ['#1a1a4e', '#0d1b3e'],
  },
  {
    id: 2,
    title: 'One Tap Emergency SOS',
    subtitle:
      'Send your location to rescue teams instantly. Help reaches you faster.',
    emoji: '🆘',
    gradient: ['#3b0a0a', '#1a0505'],
  },
  {
    id: 3,
    title: 'AI Emergency Assistant',
    subtitle:
      'Chat in English, Urdu, or Roman Urdu. Get safety guidance tailored to your situation.',
    emoji: '🤖',
    gradient: ['#0a2540', '#051525'],
  },
  {
    id: 4,
    title: 'Find Safe Routes',
    subtitle:
      'Navigate away from danger with real-time safe route guidance avoiding risk zones.',
    emoji: '🗺️',
    gradient: ['#052e16', '#021a0d'],
  },
];

/* ─── Hazard Zones ──────────────────────────────────────── */

export interface MockHazardZone {
  id: string;
  type: 'flood' | 'landslide' | 'blocked_road' | 'fire' | 'collapse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  label: string;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface MockBlockedRoad {
  id: string;
  name: string;
  reason: string;
  fromPoint: { lat: number; lng: number };
  toPoint: { lat: number; lng: number };
}

export const mockHazardZones: MockHazardZone[] = [
  {
    id: 'hz_001',
    type: 'flood',
    severity: 'high',
    label: 'Nullah Lei Flood Zone',
    description: 'Severe flooding along Nullah Lei drainage. Water depth 3-5 ft.',
    lat: 33.6720,
    lng: 73.0380,
    radiusMeters: 800,
  },
  {
    id: 'hz_002',
    type: 'flood',
    severity: 'medium',
    label: 'Rawal Dam Downstream Risk',
    description: 'Potential flash flooding from dam overflow. Stay above elevation 520m.',
    lat: 33.7100,
    lng: 73.0700,
    radiusMeters: 1200,
  },
  {
    id: 'hz_003',
    type: 'landslide',
    severity: 'medium',
    label: 'Margalla Hills Slide Zone',
    description: 'Saturated soil on Trails 3 & 5. Active debris flow reported.',
    lat: 33.7280,
    lng: 73.0420,
    radiusMeters: 600,
  },
  {
    id: 'hz_004',
    type: 'blocked_road',
    severity: 'high',
    label: 'Margalla Road Submersion',
    description: 'Road submerged under 2 ft water near F-6 intersection.',
    lat: 33.7200,
    lng: 73.0650,
    radiusMeters: 400,
  },
  {
    id: 'hz_005',
    type: 'fire',
    severity: 'low',
    label: 'I-8 Markaz Fire Incident',
    description: 'Commercial building fire. Roads cordoned off in 200m radius.',
    lat: 33.6950,
    lng: 73.0650,
    radiusMeters: 200,
  },
  {
    id: 'hz_006',
    type: 'collapse',
    severity: 'critical',
    label: 'F-10 Structural Collapse Risk',
    description: 'Old building reported partially collapsed. Avoid 150m radius.',
    lat: 33.7050,
    lng: 73.0280,
    radiusMeters: 150,
  },
];

export const mockBlockedRoads: MockBlockedRoad[] = [
  {
    id: 'br_001',
    name: 'Margalla Road (F-6 section)',
    reason: 'Flood submersion — 2 ft water depth',
    fromPoint: { lat: 33.7220, lng: 73.0600 },
    toPoint: { lat: 33.7180, lng: 73.0700 },
  },
  {
    id: 'br_002',
    name: '9th Avenue near Nullah Lei',
    reason: 'Road washed out by floodwater',
    fromPoint: { lat: 33.6750, lng: 73.0350 },
    toPoint: { lat: 33.6700, lng: 73.0400 },
  },
  {
    id: 'br_003',
    name: 'Pir Sohawa Road',
    reason: 'Landslide debris blocking both lanes',
    fromPoint: { lat: 33.7300, lng: 73.0450 },
    toPoint: { lat: 33.7350, lng: 73.0400 },
  },
];
