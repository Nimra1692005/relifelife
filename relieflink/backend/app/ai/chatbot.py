"""
AI Emergency Chatbot — Modular Provider-Agnostic Architecture

Supports multiple LLM providers (OpenAI, Gemini, local models) via
the AIProvider interface. Currently uses a built-in mock provider
for UI development.

Multi-language support: English, Urdu, Roman Urdu
"""

import re
import time
import uuid
import random
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from app.config import settings


# ─── Provider Interface ──────────────────────────────────────

class AIProvider(ABC):
    """Abstract AI provider — implement this for any LLM."""

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> Dict[str, Any]:
        """Returns {"content": str, "metadata": dict | None}"""


# ─── OpenAI Provider ─────────────────────────────────────────

class OpenAIProvider(AIProvider):
    """OpenAI Chat Completions provider."""

    @property
    def name(self) -> str:
        return "OpenAI"

    def is_available(self) -> bool:
        return bool(settings.openai_api_key)

    async def generate(self, messages, *, temperature=0.7, max_tokens=500):
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "content": data["choices"][0]["message"]["content"],
                "metadata": {"model": data["model"], "usage": data.get("usage")},
            }


# ─── Google Gemini Provider ──────────────────────────────────

class GeminiProvider(AIProvider):
    """Google Gemini provider (placeholder)."""

    @property
    def name(self) -> str:
        return "Google Gemini"

    def is_available(self) -> bool:
        # Set GEMINI_API_KEY in .env to enable
        return bool(getattr(settings, "gemini_api_key", ""))

    async def generate(self, messages, *, temperature=0.7, max_tokens=500):
        import httpx
        api_key = getattr(settings, "gemini_api_key", "")
        contents = [
            {
                "role": "model" if m["role"] == "assistant" else "user",
                "parts": [{"text": m["content"]}],
            }
            for m in messages
            if m["role"] != "system"
        ]
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
                json={"contents": contents},
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "content": data["candidates"][0]["content"]["parts"][0]["text"],
                "metadata": {"model": "gemini-pro"},
            }


# ─── Mock Provider (for UI development) ──────────────────────

class MockProvider(AIProvider):
    """Built-in mock provider with intent-based responses."""

    @property
    def name(self) -> str:
        return "Mock (Development)"

    def is_available(self) -> bool:
        return True

    async def generate(self, messages, *, temperature=0.7, max_tokens=500):
        # Get last user message
        user_msg = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"),
            "",
        )
        # Detect intent and build response
        intent = _detect_intent(user_msg)
        lang = _detect_language_from_history(messages)
        response = _build_mock_response(intent, lang)
        return {"content": response["content"], "metadata": {"intent": intent}}


# ─── System Prompts ──────────────────────────────────────────

SYSTEM_PROMPTS = {
    "en": """You are ReliefLink AI, an emergency response assistant for Pakistan.
You help citizens during disasters (floods, earthquakes, fires, landslides, storms, extreme rain).

Your priorities:
1. If someone is in immediate danger, guide them to send an SOS request
2. Provide clear, calm, actionable emergency guidance
3. Help find nearby shelters and hospitals
4. Suggest safe routes away from danger zones
5. Share relevant disaster safety tips

IMPORTANT: Always clearly distinguish between GENERAL GUIDANCE (informational advice)
and EMERGENCY ACTIONS (immediate steps to take when life is at risk).

Always be empathetic, concise, and prioritize human safety.
Respond in English.""",

    "ur": """آپ ریلیف لنک AI ہیں، پاکستان کے لیے ہنگامی ردعمل کا معاون۔
آپ شہریوں کی قدرتی آفات (سیلاب، زلزلے، آگ، لینڈ سلائیڈنگ، طوفان، شدید بارش) کے دوران مدد کرتے ہیں۔

ترجیحات:
1. اگر کوئی فوری خطرے میں ہے تو انہیں SOS بھیجنے کی رہنمائی کریں
2. واضح، پرسکون، اور قابل عمل ہنگامی رہنمائی فراہم کریں
3. قریبی پناہ گاہیں اور ہسپتال تلاش کرنے میں مدد کریں
4. خطرناک علاقوں سے محفوظ راستے تجویز کریں
5. متعلقہ حفاظتی tips شیئر کریں

اہم: ہمیشہ عام رہنمائی اور ہنگامی اقدامات کے درمیان واضح فرق کریں۔

ہمدردانہ اور مختصر جواب دیں۔ اردو میں جواب دیں۔""",

    "roman_ur": """Aap ReliefLink AI hain, Pakistan ke liye emergency response assistant.
Aap citizens ko disasters (floods, earthquakes, fire, landslides, storms, extreme rain) ke dauran madad karte hain.

Priorities:
1. Agar koi fori khatre mein hai toh unhe SOS bhejne ki guidance dein
2. Clear, calm, aur actionable emergency guidance dein
3. Qareebi shelters aur hospitals dhoondne mein madad karein
4. Khatarnaak ilaaqon se safe routes suggest karein
5. Relevant safety tips share karein

IMPORTANT: Hamesha GENERAL GUIDANCE (aam mashwara) aur EMERGENCY ACTIONS (fori qadam) ke beech wazeh farq karein.

Hamdardana aur mukhtasir jawab dein. Roman Urdu mein jawab dein.""",
}


# ─── Intent Detection ────────────────────────────────────────

INTENT_KEYWORDS: Dict[str, List[str]] = {
    "sos": ["help", "save", "emergency", "sos", "madad", "bachao", "bchao", "immediate", "danger", "khatra", "fori"],
    "shelter": ["shelter", "safe place", "panah", "jagah", "mehfooz", "refuge", "camp", "panah gah"],
    "route": ["route", "way", "path", "rasta", "jao", "evacuate", "niklo", "bhago", "leave", "escape"],
    "alerts": ["alert", "warning", "khabar", "information", "notify", "kya ho raha", "news", "update"],
    "safety": ["safe", "risk", "danger", "mehfooz", "khatra", "score", "check", "status", "halat"],
    "tips": ["tip", "advice", "guide", "mashwara", "kya karun", "what should", "how to", "prepare"],
    "hospital": ["hospital", "doctor", "medical", "shifa", "health", "dawai", "medicine", "injury", "ghayal"],
    "flood": ["flood", "paani", "selab", "barish", "rain", "drown", "doob", "water", "overflow"],
    "earthquake": ["earthquake", "zalzala", "shake", "hila", "tremor", "building"],
    "fire": ["fire", "aag", "jal", "smoke", "dhuaan", "burn"],
    "rain": ["rain", "barish", "baarish", "heavy", "musladhar", "storm", "toofan"],
}


def _detect_intent(message: str) -> str:
    """Detect user intent from message text."""
    lower = message.lower()
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        scores[intent] = sum(1 for kw in keywords if kw in lower)
    best = max(scores.items(), key=lambda x: x[1])
    return best[0] if best[1] > 0 else "general"


def _detect_language_from_history(messages: List[Dict[str, str]]) -> str:
    """Detect language from the most recent user message."""
    for m in reversed(messages):
        if m["role"] == "user":
            return _detect_language(m["content"])
    return "en"


def _detect_language(text: str) -> str:
    """Detect language: Urdu script, Roman Urdu, or English."""
    if re.search(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]", text):
        return "ur"
    roman_words = {
        "kya", "hai", "mein", "meri", "mera", "kahan", "kab", "kaise",
        "mujhe", "aap", "hum", "woh", "yeh", "nahi", "hain",
        "tha", "thi", "karun", "karo", "karna", "madad", "bhai",
        "bachao", "khatra", "paani", "barish", "ilaaqa", "qareeb",
    }
    words = set(text.lower().split())
    if len(words & roman_words) >= 2:
        return "roman_ur"
    return "en"


# ─── Mock Response Builder ───────────────────────────────────

def _build_mock_response(intent: str, lang: str) -> Dict[str, Any]:
    """Build a mock response based on intent and language."""

    responses = {
        "sos": {
            "en": "🆘 **EMERGENCY DETECTED**\n\nIf you are in immediate danger, I strongly recommend sending an SOS request right now. Rescue teams will be dispatched to your exact location.\n\n⚡ Tap the SOS button to send your emergency signal.",
            "ur": "🆘 **ہنگامی صورتحال**\n\nاگر آپ فوری خطرے میں ہیں تو ابھی SOS درخواست بھیجیں۔ ریسکیو ٹیمیں آپ کے مقام پر پہنچ جائیں گی۔",
            "roman_ur": "🆘 **EMERGENCY**\n\nAgar aap fori khatre mein hain toh abhi SOS bhejein. Rescue teams aap ki location par dispatch ho jayengi.",
        },
        "shelter": {
            "en": "Here are the safest shelters near you:\n\n🏥 F-11 Community Center — 1.2 km (266 spots)\n🕌 Al-Shifa Mosque — 0.8 km (113 spots)\n🏫 Govt Girls School — 1.8 km (388 spots)\n\nAll locations have been verified for safety. Would you like directions?",
            "ur": "آپ کے قریب محفوظ پناہ گاہیں:\n\n🏥 F-11 کمیونٹی سینٹر — 1.2 کلومیٹر\n🕌 الشفاء مسجد — 0.8 کلومیٹر\n🏫 گورنمنٹ گرلز سکول — 1.8 کلومیٹر",
            "roman_ur": "Aap ke qareeb safe shelters:\n\n🏥 F-11 Community Center — 1.2 km\n🕌 Al-Shifa Mosque — 0.8 km\n🏫 Govt Girls School — 1.8 km",
        },
        "route": {
            "en": "I've analyzed safe routes from your location. The system avoids high-risk zones and blocked roads.\n\n⚠️ Always follow local authority guidance during evacuation.\n\nTap 'Safe Navigation' for the full route map.",
            "ur": "میں نے آپ کے مقام سے محفوظ راستوں کا تجزیہ کیا ہے۔\n\n⚠️ انخلاء کے دوران مقامی حکام کی ہدایات پر عمل کریں۔",
            "roman_ur": "Maine aap ki location se safe routes analyze kiye hain.\n\n⚠️ Hamesha local authority ki guidance follow karein.",
        },
        "safety": {
            "en": "Your area (G-11, Islamabad) has a **moderate risk level** (score: 72/100).\n\n⚠️ Rawal Dam overflow risk due to heavy rainfall\n✅ Nearest shelter: Al-Shifa Mosque (0.8 km)\n\n**Recommendation:** Keep emergency kit ready and monitor alerts.",
            "ur": "آپ کا علاقہ (G-11، اسلام آباد) معتدل خطرے میں ہے (سکور: 72/100)۔\n\n⚠️ راول ڈیم اوور فلو کا خطرہ",
            "roman_ur": "Aap ka area (G-11, Islamabad) moderate risk mein hai (score: 72/100).\n\n⚠️ Rawal Dam overflow risk — heavy rainfall ki wajah se",
        },
        "alerts": {
            "en": "📡 **Active Alerts:**\n\n• Flash Flood Warning — Rawal Dam (4.2 km, 15 min ago)\n• Heavy Rainfall Advisory — Islamabad (1 hour ago)\n• Landslide Warning — Margalla Hills (6.8 km, 3 hours ago)\n\nStay vigilant and keep your emergency kit ready.",
            "ur": "📡 **فعال الرٹس:**\n\n• سیلاب کی وارننگ — راول ڈیم (4.2 کلومیٹر)\n• شدید بارش کا انتباہ — اسلام آباد",
            "roman_ur": "📡 **Active Alerts:**\n\n• Flash Flood Warning — Rawal Dam (4.2 km)\n• Heavy Rain Advisory — Islamabad\n• Landslide Warning — Margalla Hills (6.8 km)",
        },
        "tips": {
            "en": "💡 **Emergency Tips:**\n\n1. Keep emergency kit with water, food, flashlight, first-aid\n2. Know evacuation routes and meeting points\n3. Keep phone charged — carry power bank\n4. Store documents in waterproof bags\n5. Stay tuned to official channels\n6. Help elderly neighbors",
            "ur": "💡 **ہنگامی مشورے:**\n\n1. ایمرجنسی کٹ تیار رکھیں\n2. انخلاء کے راستے جانیں\n3. فون چارج رکھیں\n4. دستاویزات واٹر پروف بیگ میں رکھیں",
            "roman_ur": "💡 **Emergency Tips:**\n\n1. Emergency kit tayar rakhein\n2. Evacuation routes jaanein\n3. Phone charged rakhein\n4. Documents waterproof bags mein rakhein",
        },
        "flood": {
            "en": "🌊 **Flood Safety:**\n\n1. Move to higher ground if water is rising\n2. Do NOT walk or drive through floodwater\n3. Turn off electricity and gas if evacuating\n4. Keep important items in grab-and-go bag\n5. Listen to radio for evacuation orders",
            "ur": "🌊 **سیلاب سے بچاؤ:**\n\n1. اونچائی کی طرف جائیں\n2. سیلابی پانی میں نہ چلیں\n3. بجلی اور گیس بند کریں\n4. اہم چیزیں بیگ میں رکھیں",
            "roman_ur": "🌊 **Flood Safety:**\n\n1. Unchi jagah par jayein\n2. Flood water mein NA chalein NA gaari chalayein\n3. Bijli aur gas band karein\n4. Important cheezein grab-bag mein rakhein",
        },
        "hospital": {
            "en": "Nearest hospitals:\n\n🏨 PIMS Hospital — 3.2 km\n🏨 Shifa International — 5.1 km\n🏨 Capital Hospital — 4.8 km\n\nFor ambulance: **Call 1122**",
            "ur": "قریبی ہسپتال:\n\n🏨 PIMS ہسپتال — 3.2 کلومیٹر\n🏨 شفا انٹرنیشنل — 5.1 کلومیٹر\n\nایمبولینس: **1122 پر کال کریں**",
            "roman_ur": "Qareebi hospitals:\n\n🏨 PIMS Hospital — 3.2 km\n🏨 Shifa International — 5.1 km\n\nAmbulance: **1122 par call karein**",
        },
        "fire": {
            "en": "🔥 **Fire Emergency:**\n\n1. Stay low and crawl below smoke\n2. Feel doors before opening — if hot, find another exit\n3. Call 1122 immediately\n4. Do NOT go back inside\n5. Stop, drop, and roll if clothing catches fire",
            "ur": "🔥 **آگ سے بچاؤ:**\n\n1. دھوئیں سے نیچے رینگیں\n2. دروازے چھو کر چیک کریں\n3. فوری 1122 پر کال کریں\n4. واپس نہ جائیں",
            "roman_ur": "🔥 **Fire Emergency:**\n\n1. Smoke se neeche crawl karein\n2. Doors touch karke check karein\n3. Fori 1122 call karein\n4. Wapis NA jayein",
        },
        "earthquake": {
            "en": "🏚️ **Earthquake Safety:**\n\n1. DROP, COVER, and HOLD ON\n2. Move away from windows and heavy objects\n3. If outdoors, move to open area\n4. Check for injuries after shaking stops\n5. Be prepared for aftershocks",
            "ur": "🏚️ **زلزلے سے بچاؤ:**\n\n1. جھکیں، ڈھکیں اور پکڑیں\n2. کھڑکیوں سے دور ہٹیں\n3. باہر کھلے میدان میں جائیں\n4. آفٹر شاکس کے لیے تیار رہیں",
            "roman_ur": "🏚️ **Earthquake Safety:**\n\n1. DROP, COVER aur HOLD ON\n2. Windows se door hoon\n3. Bahar open area mein jayein\n4. Aftershocks ke liye tayar rahein",
        },
        "rain": {
            "en": "🌧️ **Heavy Rain Advisory:**\n\n1. Avoid low-lying areas and open drains\n2. Do not drive through waterlogged roads\n3. Keep emergency contacts handy\n4. Unplug electronics during lightning\n5. Stay indoors unless evacuation is needed",
            "ur": "🌧️ **شدید بارش:**\n\n1. نشیبی علاقوں سے دور رہیں\n2. پانی بھری سڑکوں پر گاڑی نہ چلائیں\n3. ایمرجنسی نمبرز تیار رکھیں",
            "roman_ur": "🌧️ **Heavy Rain:**\n\n1. Low-lying areas se door rahein\n2. Waterlogged roads par gaari NA chalayein\n3. Emergency contacts handy rakhein",
        },
        "general": {
            "en": "I'm your ReliefLink AI assistant. I can help with:\n\n🛡️ Safety analysis of your area\n🏥 Finding nearby shelters & hospitals\n🗺️ Safe evacuation routes\n⚠️ Active disaster alerts\n💡 Emergency preparedness tips\n🆘 Sending SOS to rescue teams\n\nWhat would you like help with?",
            "ur": "میں آپ کا ریلیف لنک AI اسسٹنٹ ہوں۔ میں ان چیزوں میں مدد کر سکتا ہوں:\n\n🛡️ حفاظتی تجزیہ\n🏥 پناہ گاہیں\n🗺️ محفوظ راستے\n⚠️ الرٹس\n💡 مشورے\n🆘 SOS",
            "roman_ur": "Main aap ka ReliefLink AI assistant hoon:\n\n🛡️ Safety check\n🏥 Shelters aur hospitals\n🗺️ Safe routes\n⚠️ Active alerts\n💡 Safety tips\n🆘 SOS bhejna\n\nKya madad chahiye?",
        },
    }

    template = responses.get(intent, responses["general"])
    content = template.get(lang, template["en"])

    # Detect suggested actions
    actions = _detect_actions(intent, lang)

    return {
        "content": content,
        "actions": actions,
    }


def _detect_actions(intent: str, lang: str) -> List[Dict[str, str]]:
    """Return context-appropriate action buttons."""
    action_map = {
        "sos": [{"type": "sos", "label": "🆘 Send SOS"}, {"type": "shelter", "label": "🏥 Find Shelter"}],
        "shelter": [{"type": "navigate", "label": "🗺️ Navigate"}, {"type": "sos", "label": "🆘 SOS"}],
        "route": [{"type": "open_safe_nav", "label": "🗺️ Safe Navigation"}, {"type": "sos", "label": "🆘 SOS"}],
        "safety": [{"type": "route", "label": "🗺️ Safe Routes"}, {"type": "shelter", "label": "🏥 Shelters"}],
        "alerts": [{"type": "notifications", "label": "🔔 Notifications"}, {"type": "route", "label": "🗺️ Routes"}],
        "tips": [{"type": "shelter", "label": "🏥 Shelter"}, {"type": "sos", "label": "🆘 SOS"}],
        "hospital": [{"type": "navigate", "label": "🗺️ Directions"}, {"type": "call", "label": "📞 Call 1122"}],
        "flood": [{"type": "route", "label": "🗺️ Safe Route"}, {"type": "sos", "label": "🆘 SOS"}],
        "fire": [{"type": "sos", "label": "🆘 SOS"}, {"type": "call", "label": "📞 Call 1122"}],
        "earthquake": [{"type": "route", "label": "🗺️ Safe Route"}, {"type": "sos", "label": "🆘 SOS"}],
        "rain": [{"type": "alerts", "label": "⚠️ Alerts"}, {"type": "shelter", "label": "🏥 Shelter"}],
        "general": [
            {"type": "safety", "label": "🛡️ Check Safety"},
            {"type": "shelter", "label": "🏥 Find Shelter"},
            {"type": "alerts", "label": "⚠️ Alerts"},
        ],
    }
    return action_map.get(intent, action_map["general"])


# ─── Main Chatbot Service ────────────────────────────────────

class EmergencyChatbot:
    """
    AI-powered emergency chat with modular provider support.
    
    Usage:
        chatbot = EmergencyChatbot()
        chatbot.set_provider(OpenAIProvider())  # Switch to OpenAI
        response = await chatbot.respond("Is my area safe?", "en")
    """

    def __init__(self):
        self._provider: AIProvider = MockProvider()
        self._conversations: Dict[str, List[Dict[str, str]]] = {}

        # Try to auto-detect available provider
        openai_provider = OpenAIProvider()
        if openai_provider.is_available():
            self._provider = openai_provider

    def set_provider(self, provider: AIProvider):
        """Switch the AI provider at runtime."""
        self._provider = provider

    def get_provider_info(self) -> Dict[str, Any]:
        """Get current provider info."""
        return {
            "name": self._provider.name,
            "available": self._provider.is_available(),
        }

    async def respond(
        self,
        message: str,
        language: str = "en",
        context: Optional[Dict] = None,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate AI response for user message."""

        # Get or create conversation
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        history = self._conversations.setdefault(conversation_id, [])

        # Build system prompt
        lang = language if language in SYSTEM_PROMPTS else _detect_language(message)
        system_prompt = SYSTEM_PROMPTS.get(lang, SYSTEM_PROMPTS["en"])

        if context:
            ctx_parts = []
            if context.get("location"):
                ctx_parts.append(f"User location: {context['location']}")
            if context.get("nearby_alerts"):
                ctx_parts.append(f"Active alerts nearby: {context['nearby_alerts']}")
            if context.get("nearest_shelter"):
                ctx_parts.append(f"Nearest shelter: {context['nearest_shelter']}")
            if context.get("risk_level"):
                ctx_parts.append(f"Area risk level: {context['risk_level']}")
            if context.get("risk_score"):
                ctx_parts.append(f"Risk score: {context['risk_score']}/100")
            if ctx_parts:
                system_prompt += "\n\nCurrent context:\n" + "\n".join(ctx_parts)

        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history[-10:])
        messages.append({"role": "user", "content": message})

        # Generate response
        try:
            result = await self._provider.generate(
                messages,
                temperature=0.7,
                max_tokens=500,
            )
            reply = result["content"]
        except Exception as e:
            reply = "I apologize, I encountered a technical issue. Please try again. If this is an emergency, press the SOS button."

        # Store in history
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": reply})

        # Detect actions
        intent = _detect_intent(message)
        actions = _detect_actions(intent, lang)

        return {
            "reply": reply,
            "language": lang,
            "intent": intent,
            "actions": actions,
            "conversation_id": conversation_id,
            "provider": self._provider.name,
        }

    def get_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """Get conversation history."""
        return self._conversations.get(conversation_id, [])

    def clear_history(self, conversation_id: str):
        """Clear a conversation."""
        self._conversations.pop(conversation_id, None)


# Singleton instance
chatbot = EmergencyChatbot()
