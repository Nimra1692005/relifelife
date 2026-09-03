/**
 * ReliefLink — Modular AI Emergency Assistant Service
 *
 * Provider-agnostic architecture: swap in any LLM (OpenAI, Gemini, local model)
 * by implementing the AIProvider interface.
 *
 * Features:
 * - Multi-language support (English, Urdu, Roman Urdu)
 * - Intent detection (SOS, shelter, route, alerts, safety, tips)
 * - Location-aware context enrichment
 * - Emergency warning cards vs. general guidance
 * - Conversation management with history
 */

import { analyzeRisk, findSafeDestinations, type RiskLevel, type RiskAssessment } from './riskAnalysis';
import { mockAlerts, mockLocation } from '../utils/sampleData';

// ─── Types ─────────────────────────────────────────────────

export type Language = 'en' | 'ur' | 'roman_ur';

export type MessageType = 'text' | 'warning' | 'action' | 'info' | 'emergency' | 'tips' | 'shelter_list';

export type IntentType =
  | 'sos'
  | 'shelter'
  | 'route'
  | 'alerts'
  | 'safety'
  | 'tips'
  | 'hospital'
  | 'flood'
  | 'earthquake'
  | 'fire'
  | 'rain'
  | 'general';

export interface ChatAction {
  type: string;
  label: string;
  payload?: Record<string, any>;
}

export interface WarningCard {
  severity: RiskLevel;
  title: string;
  description: string;
  icon: string;
}

export interface ShelterItem {
  name: string;
  distance: string;
  capacity: number;
  safetyScore: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: MessageType;
  timestamp: Date;
  language?: Language;
  actions?: ChatAction[];
  warningCard?: WarningCard;
  shelterList?: ShelterItem[];
  isEmergency?: boolean;
  tips?: string[];
}

export interface ConversationContext {
  userId?: string;
  latitude: number;
  longitude: number;
  address?: string;
  riskAssessment?: RiskAssessment;
  language: Language;
}

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
}

// ─── Provider Interface (swap in any LLM) ──────────────────

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateResponse(
    messages: { role: string; content: string }[],
    config: AIProviderConfig
  ): Promise<{ content: string; metadata?: Record<string, any> }>;
}

// ─── Intent Detection ──────────────────────────────────────

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  sos: ['help', 'save', 'emergency', 'sos', 'madad', 'bachao', 'bchao', 'immediate', 'danger', 'khatra', 'fori'],
  shelter: ['shelter', 'safe place', 'panah', 'jagah', 'mehfooz', 'refuge', 'camp', 'pnnah gah'],
  route: ['route', 'way', 'path', 'rasta', 'jao', 'evacuate', 'niklo', 'bhago', 'leave', 'escape'],
  alerts: ['alert', 'warning', 'khabar', 'information', 'notify', 'kya ho raha', 'news', 'update'],
  safety: ['safe', 'risk', 'danger', 'mehfooz', 'khatra', 'score', 'check', 'status', 'halat'],
  tips: ['tip', 'advice', 'guide', 'mashwara', 'kya karun', 'what should', 'how to', 'prepare'],
  hospital: ['hospital', 'doctor', 'medical', 'shifa', 'health', 'dawai', 'medicine', 'injury', 'ghayal'],
  flood: ['flood', 'paani', 'selab', 'barish', 'rain', 'drown', 'doob', 'water', 'overflow'],
  earthquake: ['earthquake', 'zalzala', 'shake', 'hila', 'tremor', 'building'],
  fire: ['fire', 'aag', 'jal', 'smoke', 'dhuaan', 'burn'],
  rain: ['rain', 'barish', 'baarish', 'heavy', 'musladhar', 'storm', 'toofan'],
  general: [],
};

export function detectIntent(message: string): IntentType {
  const lower = message.toLowerCase();
  const scores: Record<IntentType, number> = {} as any;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [IntentType, string[]][]) {
    scores[intent] = keywords.filter(kw => lower.includes(kw)).length;
  }

  const best = (Object.entries(scores) as [IntentType, number][])
    .filter(([k]) => k !== 'general')
    .sort((a, b) => b[1] - a[1])[0];

  return best && best[1] > 0 ? best[0] : 'general';
}

// ─── Language Detection ────────────────────────────────────

const URDU_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ROMAN_URDU_WORDS = [
  'kya', 'hai', 'mein', 'meri', 'mera', 'kahan', 'kab', 'kaise', 'kaun',
  'mujhe', 'tumhe', 'aap', 'hum', 'woh', 'yeh', 'nahi', 'hai', 'hain',
  'tha', 'thi', 'karun', 'karo', 'karna', 'raha', 'rahi', 'rahe',
  'madad', 'bhai', 'bachao', 'khatra', 'paani', 'barish', 'ilaaqa',
  'qareeb', 'dur', 'kaisey', 'hoon', 'ho', 'hun', 'gaya', 'gayi',
];

export function detectLanguage(message: string): Language {
  if (URDU_CHAR_REGEX.test(message)) return 'ur';
  const words = message.toLowerCase().split(/\s+/);
  const romanHits = words.filter(w => ROMAN_URDU_WORDS.includes(w)).length;
  if (romanHits >= 2 || (words.length <= 5 && romanHits >= 1)) return 'roman_ur';
  return 'en';
}

// ─── Context Builder ───────────────────────────────────────

export function buildContext(): ConversationContext {
  const risk = analyzeRisk(mockLocation.latitude, mockLocation.longitude);
  return {
    userId: 'u_001',
    latitude: mockLocation.latitude,
    longitude: mockLocation.longitude,
    address: mockLocation.address,
    riskAssessment: risk,
    language: 'en',
  };
}

// ─── Suggested Questions ───────────────────────────────────

export const SUGGESTED_QUESTIONS: Record<Language, { text: string; intent: IntentType; icon: string }[]> = {
  en: [
    { text: 'Is my area safe?', intent: 'safety', icon: '🛡️' },
    { text: 'Find nearest shelter', intent: 'shelter', icon: '🏥' },
    { text: 'Show me a safe route', intent: 'route', icon: '🗺️' },
    { text: 'What are the active alerts?', intent: 'alerts', icon: '⚠️' },
    { text: 'Flood safety tips', intent: 'tips', icon: '💡' },
    { text: 'Nearest hospital?', intent: 'hospital', icon: '🏨' },
  ],
  ur: [
    { text: 'کیا میرا علاقہ محفوظ ہے؟', intent: 'safety', icon: '🛡️' },
    { text: 'قریبی پناہ گاہ بتائیں', intent: 'shelter', icon: '🏥' },
    { text: 'محفوظ راستہ دکھائیں', intent: 'route', icon: '🗺️' },
    { text: 'فعال الرٹ کیا ہیں؟', intent: 'alerts', icon: '⚠️' },
    { text: 'سیلاب سے بچاؤ کے ٹپس', intent: 'tips', icon: '💡' },
    { text: 'قریبی ہسپتال کہاں ہے؟', intent: 'hospital', icon: '🏨' },
  ],
  roman_ur: [
    { text: 'Mere area mein flood hai, main kya karun?', intent: 'flood', icon: '🌊' },
    { text: 'Nearest hospital kahan hai?', intent: 'hospital', icon: '🏨' },
    { text: 'Kya mera ilaaqa safe hai?', intent: 'safety', icon: '🛡️' },
    { text: 'Safe route batao', intent: 'route', icon: '🗺️' },
    { text: 'Heavy rain ho rahi hai, dangerous hai?', intent: 'rain', icon: '🌧️' },
    { text: 'Qareebi shelter dikhao', intent: 'shelter', icon: '🏥' },
  ],
};

// ─── Response Templates (multi-language) ───────────────────

const RESPONSES: Record<string, Record<Language, {
  content: string;
  actions?: ChatAction[];
  warningCard?: WarningCard;
  tips?: string[];
  isEmergency?: boolean;
}>> = {
  sos: {
    en: {
      content: '🆘 **EMERGENCY DETECTED**\n\nIf you are in immediate danger, I strongly recommend sending an SOS request right now. Rescue teams will be dispatched to your exact location.\n\n⚡ Tap the button below to send your emergency signal immediately.',
      isEmergency: true,
      actions: [
        { type: 'sos', label: '🆘 Send SOS Now' },
        { type: 'shelter', label: '🏥 Find Shelter' },
      ],
    },
    ur: {
      content: '🆘 **ہنگامی صورتحال**\n\nاگر آپ فوری خطرے میں ہیں تو ابھی SOS درخواست بھیجیں۔ ریسکیو ٹیمیں آپ کے مقام پر پہنچ جائیں گی۔\n\n⚡ نیچے بٹن دبائیں۔',
      isEmergency: true,
      actions: [
        { type: 'sos', label: '🆘 ابھی SOS بھیجیں' },
        { type: 'shelter', label: '🏥 پناہ گاہ تلاش کریں' },
      ],
    },
    roman_ur: {
      content: '🆘 **EMERGENCY SITUATION**\n\nAgar aap fori khatre mein hain toh abhi SOS request bhejein. Rescue teams aap ki location par dispatch ho jayengi.\n\n⚡ Neeche button dabayein fori madad ke liye.',
      isEmergency: true,
      actions: [
        { type: 'sos', label: '🆘 Abhi SOS Bhejo' },
        { type: 'shelter', label: '🏥 Shelter Dhoondo' },
      ],
    },
  },
  safety: {
    en: {
      content: 'Based on your current location ({address}), here\'s your safety analysis:

Your area has a **{risk_label}** risk level (score: {score}/100).

{risk_description}

{nearby_hazards}',
      actions: [
        { type: 'route', label: '🗺️ View Safe Routes' },
        { type: 'shelter', label: '🏥 Nearby Shelters' },
        { type: 'alerts', label: '⚠️ All Alerts' },
      ],
    },
    ur: {
      content: 'آپ کے موجودہ مقام ({address}) کے مطابق:\n\nآپ کا علاقہ **{risk_label}** خطرے کی سطح پر ہے (سکور: {score}/100)۔\n\n{risk_description}',
      actions: [
        { type: 'route', label: '🗺️ محفوظ راستے' },
        { type: 'shelter', label: '🏥 قریبی پناہ گاہیں' },
      ],
    },
    roman_ur: {
      content: 'Aap ki current location ({address}) ke mutabiq:\n\nAap ka ilaaqa **{risk_label}** risk level par hai (score: {score}/100).\n\n{risk_description}\n\n{nearby_hazards}',
      actions: [
        { type: 'route', label: '🗺️ Safe Rastay' },
        { type: 'shelter', label: '🏥 Qareebi Shelters' },
      ],
    },
  },
  shelter: {
    en: {
      content: 'Here are the safest shelters near you, ranked by safety score:',
      actions: [
        { type: 'navigate', label: '🗺️ Navigate to Top Pick' },
        { type: 'sos', label: '🆘 Emergency SOS' },
      ],
    },
    ur: {
      content: 'آپ کے قریب ترین محفوظ پناہ گاہیں:',
      actions: [
        { type: 'navigate', label: '🗺️ پہلی پناہ گاہ تک' },
        { type: 'sos', label: '🆘 ایمرجنسی' },
      ],
    },
    roman_ur: {
      content: 'Aap ke qareeb sab se safe shelters, safety score ke hisaab se:',
      actions: [
        { type: 'navigate', label: '🗺️ Top Shelter Tak' },
        { type: 'sos', label: '🆘 Emergency SOS' },
      ],
    },
  },
  route: {
    en: {
      content: 'I\'ve analyzed safe routes from your location. The system avoids high-risk zones and blocked roads.

⚠️ Always follow local authority guidance during evacuation.

Tap below to view the full route analysis.',
      actions: [
        { type: 'open_safe_nav', label: '🗺️ Open Safe Navigation' },
        { type: 'sos', label: '🆘 Send SOS' },
      ],
    },
    ur: {
      content: 'میں نے آپ کے مقام سے محفوظ راستوں کا تجزیہ کیا ہے۔ نظام خطرناک علاقوں اور بند سڑکوں سے بچتا ہے۔',
      actions: [
        { type: 'open_safe_nav', label: '🗺️ محفوظ راستہ دیکھیں' },
        { type: 'sos', label: '🆘 SOS بھیجیں' },
      ],
    },
    roman_ur: {
      content: 'Maine aap ki location se safe routes analyze kiye hain. System high-risk zones aur blocked roads se bachata hai.\n\n⚠️ Hamesha local authority ki guidance follow karein.',
      actions: [
        { type: 'open_safe_nav', label: '🗺️ Safe Navigation' },
        { type: 'sos', label: '🆘 SOS Bhejo' },
      ],
    },
  },
  alerts: {
    en: {
      content: '📡 **Active Alerts in Your Area**\n\n{alerts_text}\n\nStay vigilant and keep your emergency kit ready.',
      actions: [
        { type: 'notifications', label: '🔔 View All Notifications' },
        { type: 'route', label: '🗺️ Safe Routes' },
      ],
    },
    ur: {
      content: '📡 **آپ کے علاقے میں فعال الرٹس**\n\n{alerts_text}\n\nچوکس رہیں اور اپنا ایمرجنسی کٹ تیار رکھیں۔',
      actions: [
        { type: 'notifications', label: '🔔 تمام نوٹیفکیشن' },
        { type: 'route', label: '🗺️ محفوظ راستے' },
      ],
    },
    roman_ur: {
      content: '📡 **Aap ke area mein active alerts**\n\n{alerts_text}\n\nChaukanna rahein aur emergency kit tayar rakhein.',
      actions: [
        { type: 'notifications', label: '🔔 Sab Notifications' },
        { type: 'route', label: '🗺️ Safe Routes' },
      ],
    },
  },
  tips: {
    en: {
      content: '💡 **Emergency Preparedness Tips**',
      tips: [
        'Keep an emergency kit with water, food, flashlight, and first-aid supplies',
        'Know your area\'s evacuation routes and meeting points',
        'Keep phone charged — carry a power bank',
        'Store important documents in waterproof bags',
        'Stay tuned to official channels for updates',
        'Help elderly neighbors and people with disabilities',
      ],
      actions: [
        { type: 'shelter', label: '🏥 Find Shelter' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
    ur: {
      content: '💡 **ہنگامی تیاری کے مشورے**',
      tips: [
        'ایمرجنسی کٹ تیار رکھیں: پانی، کھانا، ٹارچ، فرسٹ ایڈ',
        'علاقے کے انخلاء کے راستے جانیں',
        'فون چارج رکھیں — پاور بینک ساتھ رکھیں',
        'اہم دستاویزات واٹر پروف بیگ میں رکھیں',
        'سرکاری چینلز سے اپ ڈیٹ لیتے رہیں',
      ],
      actions: [
        { type: 'shelter', label: '🏥 پناہ گاہ' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
    roman_ur: {
      content: '💡 **Emergency Tips — Jaan Bachao**',
      tips: [
        'Emergency kit tayar rakhein: paani, khaana, torch, first-aid',
        'Apne area ke evacuation routes jaanein',
        'Phone charged rakhein — power bank carry karein',
        'Important documents waterproof bags mein rakhein',
        'Official channels se updates lete rahein',
        'Buzurgon aur disabled logon ki madad karein',
      ],
      actions: [
        { type: 'shelter', label: '🏥 Shelter' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
  },
  flood: {
    en: {
      content: '🌊 **Flood Safety Guidance**',
      warningCard: { severity: 'high', title: 'Flood Risk Active', description: 'Rawal Dam overflow risk — downstream areas at risk', icon: '🌊' },
      tips: [
        'Move to higher ground immediately if water is rising',
        'Do NOT walk or drive through floodwater',
        'Turn off electricity and gas if evacuating',
        'Keep important items in a grab-and-go bag',
        'Listen to radio for official evacuation orders',
      ],
      actions: [
        { type: 'route', label: '🗺️ Safe Route to Higher Ground' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
    ur: {
      content: '🌊 **سیلاب سے بچاؤ کی رہنمائی**',
      warningCard: { severity: 'high', title: 'سیلاب کا خطرہ فعال', description: 'راول ڈیم اوور فلو — نیچے والے علاقے خطرے میں', icon: '🌊' },
      tips: [
        'پانی بڑھ رہا ہو تو فوراً اونچائی کی طرف جائیں',
        'سیلابی پانی میں نہ چلیں اور نہ گاڑی چلائیں',
        'نکلتے وقت بجلی اور گیس بند کریں',
        'ریڈیو سے سرکاری احکامات سنتے رہیں',
      ],
      actions: [
        { type: 'route', label: '🗺️ محفوظ راستہ' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
    roman_ur: {
      content: '🌊 **Flood Safety Guidance**',
      warningCard: { severity: 'high', title: 'Flood Risk Active', description: 'Rawal Dam overflow — downstream areas khatre mein', icon: '🌊' },
      tips: [
        'Agar paani barh raha hai toh fori unchi jagah par jayein',
        'Flood water mein NA paidal chalein NA gaari chalayein',
        'Niklte waqt bijli aur gas band karein',
        'Important cheezein grab-and-go bag mein rakhein',
        'Radio par official evacuation orders sunte rahein',
      ],
      actions: [
        { type: 'route', label: '🗺️ Safe Route' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
  },
  hospital: {
    en: {
      content: 'Here are the nearest hospitals and medical facilities:',
      actions: [
        { type: 'navigate', label: '🗺️ Get Directions' },
        { type: 'call', label: '📞 Call Ambulance 1122' },
      ],
    },
    ur: {
      content: 'قریبی ہسپتال اور طبی سہولیات:',
      actions: [
        { type: 'navigate', label: '🗺️ راستہ' },
        { type: 'call', label: '📞 ایمبولینس 1122' },
      ],
    },
    roman_ur: {
      content: 'Qareebi hospitals aur medical facilities:',
      actions: [
        { type: 'navigate', label: '🗺️ Directions' },
        { type: 'call', label: '📞 Ambulance 1122' },
      ],
    },
  },
  rain: {
    en: {
      content: '🌧️ **Heavy Rain Advisory**',
      warningCard: { severity: 'medium', title: 'Heavy Rainfall Advisory', description: '80-120mm expected in next 24 hours', icon: '🌧️' },
      tips: [
        'Avoid low-lying areas and open drains',
        'Do not drive through waterlogged roads',
        'Keep emergency contacts handy',
        'Unplug electronics during lightning',
        'Stay indoors unless evacuation is necessary',
      ],
      actions: [
        { type: 'alerts', label: '⚠️ Active Alerts' },
        { type: 'shelter', label: '🏥 Find Shelter' },
      ],
    },
    ur: {
      content: '🌧️ **شدید بارش کا الرٹ**',
      warningCard: { severity: 'medium', title: 'شدید بارش کا انتباہ', description: 'اگلے 24 گھنٹوں میں 80-120 ملی میٹر متوقع', icon: '🌧️' },
      tips: [
        'نشیبی علاقوں اور نالوں سے دور رہیں',
        'پانی سے بھری سڑکوں پر گاڑی نہ چلائیں',
        'ایمرجنسی نمبرز تیار رکھیں',
        'بجلی کے وقت الیکٹرانکس ان پلگ کریں',
      ],
      actions: [
        { type: 'alerts', label: '⚠️ الرٹس' },
        { type: 'shelter', label: '🏥 پناہ گاہ' },
      ],
    },
    roman_ur: {
      content: '🌧️ **Heavy Rain Advisory**',
      warningCard: { severity: 'medium', title: 'Heavy Rain Advisory', description: 'Next 24 hours mein 80-120mm expected', icon: '🌧️' },
      tips: [
        'Low-lying areas aur open drains se door rahein',
        'Waterlogged roads par gaari NA chalayein',
        'Emergency contacts handy rakhein',
        'Lightning ke waqt electronics unplug karein',
        'Ghar mein rahein jab tak evacuation zaroori na ho',
      ],
      actions: [
        { type: 'alerts', label: '⚠️ Alerts' },
        { type: 'shelter', label: '🏥 Shelter' },
      ],
    },
  },
  earthquake: {
    en: {
      content: '🏚️ **Earthquake Safety**',
      tips: [
        'DROP, COVER, and HOLD ON during shaking',
        'Move away from windows, heavy objects, and exterior walls',
        'If outdoors, move to an open area away from buildings',
        'After shaking stops, check for injuries and hazards',
        'Be prepared for aftershocks',
        'Do not use elevators',
      ],
      actions: [
        { type: 'route', label: '🗺️ Safe Route' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
    ur: {
      content: '🏚️ **زلزلے سے بچاؤ**',
      tips: [
        'جھٹکوں کے دوران جھکیں، ڈھکیں اور پکڑیں',
        'کھڑکیوں اور بھاری چیزوں سے دور ہٹیں',
        'باہر ہوں تو کھلے میدان میں جائیں',
        'جھٹکے رکنے کے بعد زخمیوں کی مدد کریں',
        'آفٹر شاکس کے لیے تیار رہیں',
      ],
      actions: [
        { type: 'route', label: '🗺️ محفوظ راستہ' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
    roman_ur: {
      content: '🏚️ **Earthquake Safety**',
      tips: [
        'Shaking ke dauran DROP, COVER aur HOLD ON karein',
        'Windows, heavy objects aur exterior walls se door hoon',
        'Agar bahar hain toh open area mein jayein',
        'Shaking rukne ke baad injuries check karein',
        'Aftershocks ke liye tayar rahein',
        'Elevators use NA karein',
      ],
      actions: [
        { type: 'route', label: '🗺️ Safe Route' },
        { type: 'sos', label: '🆘 SOS' },
      ],
    },
  },
  fire: {
    en: {
      content: '🔥 **Fire Emergency Guidance**',
      warningCard: { severity: 'critical', title: 'Fire Emergency', description: 'Follow evacuation procedures immediately', icon: '🔥' },
      tips: [
        'Stay low and crawl below smoke',
        'Feel doors before opening — if hot, find another exit',
        'Call 1122 immediately',
        'Do not go back inside for belongings',
        'Stop, drop, and roll if clothing catches fire',
      ],
      isEmergency: true,
      actions: [
        { type: 'sos', label: '🆘 Send SOS' },
        { type: 'call', label: '📞 Call 1122' },
      ],
    },
    ur: {
      content: '🔥 **آگ سے بچاؤ**',
      warningCard: { severity: 'critical', title: 'آگ کی ہنگامی صورتحال', description: 'فوری طور پر انخلاء کریں', icon: '🔥' },
      tips: [
        'نیچے رہیں اور دھوئیں سے بچتے ہوئے رینگیں',
        'دروازے کھولنے سے پہلے چھوئیں — گرم ہو تو دوسرا راستہ',
        'فوری 1122 پر کال کریں',
        'سامان کے لیے واپس نہ جائیں',
      ],
      isEmergency: true,
      actions: [
        { type: 'sos', label: '🆘 SOS' },
        { type: 'call', label: '📞 1122' },
      ],
    },
    roman_ur: {
      content: '🔥 **Fire Emergency**',
      warningCard: { severity: 'critical', title: 'Fire Emergency', description: 'Fori evacuation karein', icon: '🔥' },
      tips: [
        'Neeche rahein aur smoke se neeche crawl karein',
        'Doors kholne se pehle touch karein — agar garam hai toh doosra exit',
        'Fori 1122 par call karein',
        'Samaan ke liye wapis NA jayein',
        'Stop, drop aur roll agar kapdon par aag lag jaye',
      ],
      isEmergency: true,
      actions: [
        { type: 'sos', label: '🆘 SOS Bhejo' },
        { type: 'call', label: '📞 1122 Call' },
      ],
    },
  },
  general: {
    en: {
      content: 'I\'m your ReliefLink AI assistant. I can help you with:

🛡️ **Safety Analysis** — Check your area\'s risk level
🏥 **Shelters & Hospitals** — Find nearby safe places
🗺️ **Safe Routes** — Navigate away from danger
⚠️ **Active Alerts** — Latest disaster warnings
💡 **Safety Tips** — Preparedness guidance
🆘 **SOS** — Send emergency signal

What would you like help with?',
      actions: [
        { type: 'safety', label: '🛡️ Check Safety' },
        { type: 'shelter', label: '🏥 Find Shelter' },
        { type: 'alerts', label: '⚠️ Active Alerts' },
      ],
    },
    ur: {
      content: 'میں آپ کا ریلیف لنک AI اسسٹنٹ ہوں۔ میں مدد کر سکتا ہوں:\n\n🛡️ حفاظتی تجزیہ\n🏥 پناہ گاہیں اور ہسپتال\n🗺️ محفوظ راستے\n⚠️ فعال الرٹس\n💡 حفاظتی مشورے\n🆘 ایمرجنسی SOS',
      actions: [
        { type: 'safety', label: '🛡️ حفاظت چیک کریں' },
        { type: 'shelter', label: '🏥 پناہ گاہ' },
        { type: 'alerts', label: '⚠️ الرٹس' },
      ],
    },
    roman_ur: {
      content: 'Main aap ka ReliefLink AI assistant hoon. Main in cheezon mein madad kar sakta hoon:\n\n🛡️ **Safety Analysis** — Area ka risk level check\n🏥 **Shelters & Hospitals** — Qareebi safe jagah\n🗺️ **Safe Routes** — Khatre se door jao\n⚠️ **Active Alerts** — Latest disaster warnings\n💡 **Safety Tips** — Taiyari ki guidance\n🆘 **SOS** — Emergency signal bhejo\n\nKya madad chahiye?',
      actions: [
        { type: 'safety', label: '🛡️ Safety Check' },
        { type: 'shelter', label: '🏥 Shelter' },
        { type: 'alerts', label: '⚠️ Alerts' },
      ],
    },
  },
};

// ─── Mock AI Provider (for UI development) ─────────────────

export class MockAIProvider implements AIProvider {
  name = 'Mock Provider (Development)';

  isAvailable(): boolean {
    return true;
  }

  async generateResponse(
    _messages: { role: string; content: string }[],
    _config: AIProviderConfig
  ): Promise<{ content: string; metadata?: Record<string, any> }> {
    // This is not used — logic is in AIAassistantService
    return { content: '' };
  }
}

// ─── OpenAI Provider (placeholder for integration) ──────────

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';

  isAvailable(): boolean {
    return false; // Set to true when API key is configured
  }

  async generateResponse(
    messages: { role: string; content: string }[],
    config: AIProviderConfig
  ): Promise<{ content: string; metadata?: Record<string, any> }> {
    if (!config.apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch(config.endpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      metadata: {
        usage: data.usage,
        model: data.model,
      },
    };
  }
}

// ─── Gemini Provider (placeholder for integration) ──────────

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';

  isAvailable(): boolean {
    return false;
  }

  async generateResponse(
    messages: { role: string; content: string }[],
    config: AIProviderConfig
  ): Promise<{ content: string; metadata?: Record<string, any> }> {
    if (!config.apiKey) throw new Error('Gemini API key not configured');

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();

    return {
      content: data.candidates[0].content.parts[0].text,
      metadata: { model: config.model },
    };
  }
}

// ─── Main AI Assistant Service ──────────────────────────────

class AIAssistantService {
  private provider: AIProvider;
  private providerConfig: AIProviderConfig;
  private context: ConversationContext;
  private conversationHistory: { role: string; content: string }[] = [];

  constructor() {
    this.provider = new MockAIProvider();
    this.providerConfig = { temperature: 0.7, maxTokens: 600 };
    this.context = buildContext();
  }

  /** Switch the AI provider at runtime */
  setProvider(provider: AIProvider, config?: AIProviderConfig) {
    this.provider = provider;
    if (config) this.providerConfig = config;
  }

  /** Get current provider info */
  getProviderInfo() {
    return { name: this.provider.name, available: this.provider.isAvailable() };
  }

  /** Update conversation context */
  updateContext(partial: Partial<ConversationContext>) {
    this.context = { ...this.context, ...partial };
  }

  /** Generate AI response for a user message */
  async sendMessage(userMessage: string): Promise<ChatMessage> {
    // Detect language from user message
    const detectedLang = detectLanguage(userMessage);
    this.context.language = detectedLang;

    // Detect intent
    const intent = detectIntent(userMessage);

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // Simulate realistic AI processing delay
    const delay = 800 + Math.random() * 1400;
    await new Promise(r => setTimeout(r, delay));

    // Generate response
    const response = this.generateResponse(intent, detectedLang);

    // Add to conversation history
    this.conversationHistory.push({ role: 'assistant', content: response.content });

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      content: response.content,
      type: this.getMessageType(intent),
      timestamp: new Date(),
      language: detectedLang,
      actions: response.actions,
      warningCard: response.warningCard,
      shelterList: response.shelterList,
      isEmergency: response.isEmergency,
      tips: response.tips,
    };
  }

  /** Generate response based on intent and language */
  private generateResponse(intent: IntentType, lang: Language): {
    content: string;
    actions?: ChatAction[];
    warningCard?: WarningCard;
    shelterList?: ShelterItem[];
    tips?: string[];
    isEmergency?: boolean;
  } {
    const template = RESPONSES[intent]?.[lang] || RESPONSES['general'][lang] || RESPONSES['general']['en'];

    let content = template.content;

    // Enrich with real context data
    const risk = this.context.riskAssessment;
    if (risk) {
      content = content
        .replace('{address}', this.context.address || 'Islamabad')
        .replace('{risk_label}', risk.label)
        .replace('{score}', String(risk.overallScore))
        .replace('{risk_description}', risk.description)
        .replace('{nearby_hazards}', this.formatHazards(risk));
    }

    // Enrich alerts
    content = content.replace('{alerts_text}', this.formatAlerts(lang));

    // Build shelter list if needed
    let shelterList: ShelterItem[] | undefined;
    if (intent === 'shelter' || intent === 'hospital') {
      const destinations = findSafeDestinations(
        this.context.latitude,
        this.context.longitude
      );
      shelterList = destinations.slice(0, 5).map(d => ({
        name: d.name,
        distance: d.distanceKm < 1 ? `${Math.round(d.distanceKm * 1000)}m` : `${d.distanceKm.toFixed(1)} km`,
        capacity: d.capacity,
        safetyScore: d.safetyScore,
        type: d.type,
      }));
    }

    return {
      content,
      actions: template.actions,
      warningCard: template.warningCard,
      shelterList,
      tips: template.tips,
      isEmergency: template.isEmergency,
    };
  }

  private formatHazards(risk: RiskAssessment): string {
    if (risk.nearbyHazards.length === 0) return '✅ No immediate hazards detected nearby.';
    const top = risk.nearbyHazards.slice(0, 3);
    return top.map(h => `⚠️ ${h.label} — ${h.distanceKm.toFixed(1)} km away`).join('\n');
  }

  private formatAlerts(lang: Language): string {
    const active = mockAlerts.slice(0, 3);
    if (lang === 'ur') {
      return active.map(a => `• ${a.title} (${a.distance})`).join('\n');
    }
    return active.map(a => `• **${a.title}**\n  📍 ${a.distance} away · ${a.time}`).join('\n');
  }

  private getMessageType(intent: IntentType): MessageType {
    switch (intent) {
      case 'sos': return 'emergency';
      case 'shelter':
      case 'hospital': return 'shelter_list';
      case 'flood':
      case 'earthquake':
      case 'fire':
      case 'rain': return 'warning';
      case 'alerts': return 'info';
      case 'tips': return 'tips';
      case 'safety': return 'action';
      case 'route': return 'action';
      default: return 'text';
    }
  }

  /** Get the welcome message for a language */
  getWelcomeMessage(lang: Language): ChatMessage {
    const greetings: Record<Language, string> = {
      en: 'Assalam-o-Alaikum! I\'m your **ReliefLink AI** emergency assistant.\n\nI can help you in English, Urdu, or Roman Urdu. Ask me anything about safety, shelters, evacuation routes, or disaster preparedness.',
      ur: 'السلام علیکم! میں آپ کا **ریلیف لنک AI** ایمرجنسی اسسٹنٹ ہوں۔\n\nمیں آپ کی حفاظت، پناہ گاہوں، انخلاء کے راستوں اور آفات سے بچاؤ میں مدد کر سکتا ہوں۔',
      roman_ur: 'Assalam-o-Alaikum! Main aap ka **ReliefLink AI** emergency assistant hoon.\n\nMain English, Urdu aur Roman Urdu mein madad kar sakta hoon. Safety, shelters, evacuation routes — kuch bhi poochein.',
    };

    return {
      id: 'welcome',
      role: 'assistant',
      content: greetings[lang],
      type: 'text',
      timestamp: new Date(),
      language: lang,
      actions: [
        { type: 'safety', label: lang === 'ur' ? '🛡️ حفاظت چیک کریں' : '🛡️ Check My Safety' },
        { type: 'shelter', label: lang === 'ur' ? '🏥 پناہ گاہ' : '🏥 Find Shelter' },
        { type: 'route', label: lang === 'ur' ? '🗺️ محفوظ راستہ' : '🗺️ Safe Route' },
        { type: 'tips', label: lang === 'ur' ? '💡 حفاظتی مشورے' : '💡 Safety Tips' },
      ],
    };
  }

  /** Clear conversation history */
  clearConversation() {
    this.conversationHistory = [];
  }

  /** Get conversation history */
  getHistory() {
    return [...this.conversationHistory];
  }
}

// Singleton
export const aiService = new AIAssistantService();
