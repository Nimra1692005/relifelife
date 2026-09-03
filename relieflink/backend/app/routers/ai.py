"""
AI Assistant Router — Multi-language emergency chatbot endpoints

Provides:
- POST /ai/chat — Send message, get AI response with actions
- GET  /ai/chat/history — Retrieve conversation history
- POST /ai/chat/clear — Clear a conversation
- GET  /ai/provider — Check current AI provider info
- POST /ai/provider/switch — Switch AI provider at runtime
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.ai.chatbot import chatbot

router = APIRouter()


# ─── Request / Response Schemas ──────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    language: str = Field("en", description="Preferred language: en | ur | roman_ur")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for continuity")
    context: Optional[dict] = Field(None, description="Optional context: location, risk, alerts")


class ChatActionResponse(BaseModel):
    type: str
    label: str


class ChatResponse(BaseModel):
    reply: str
    language: str
    intent: str
    actions: Optional[List[ChatActionResponse]] = None
    conversation_id: str
    provider: str


class ChatHistoryResponse(BaseModel):
    conversation_id: str
    messages: List[dict]
    message_count: int


class ProviderInfoResponse(BaseModel):
    name: str
    available: bool


class ProviderSwitchRequest(BaseModel):
    provider: str = Field(..., description="Provider name: mock | openai | gemini")
    api_key: Optional[str] = Field(None, description="API key (if required)")


# ─── Endpoints ───────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(body: ChatRequest):
    """
    Send a message to the AI emergency assistant.
    
    Supports English, Urdu, and Roman Urdu. Automatically detects
    user's language and intent (SOS, shelter, route, alerts, etc.)
    
    Returns AI response with context-appropriate action buttons.
    """
    try:
        result = await chatbot.respond(
            message=body.message,
            language=body.language,
            context=body.context,
            conversation_id=body.conversation_id,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}",
        )


@router.get("/chat/history", response_model=ChatHistoryResponse)
async def chat_history(conversation_id: str):
    """Get conversation history for a given conversation ID."""
    history = chatbot.get_history(conversation_id)
    return ChatHistoryResponse(
        conversation_id=conversation_id,
        messages=history,
        message_count=len(history),
    )


@router.post("/chat/clear")
async def chat_clear(conversation_id: str):
    """Clear a conversation's history."""
    chatbot.clear_history(conversation_id)
    return {"status": "cleared", "conversation_id": conversation_id}


@router.get("/provider", response_model=ProviderInfoResponse)
async def get_provider():
    """Get current AI provider info."""
    info = chatbot.get_provider_info()
    return ProviderInfoResponse(**info)


@router.post("/provider/switch")
async def switch_provider(body: ProviderSwitchRequest):
    """
    Switch the AI provider at runtime.
    
    Available providers:
    - "mock" — Built-in mock (always available)
    - "openai" — OpenAI GPT (requires API key)
    - "gemini" — Google Gemini (requires API key)
    """
    from app.ai.chatbot import MockProvider, OpenAIProvider, GeminiProvider

    providers = {
        "mock": MockProvider,
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
    }

    if body.provider not in providers:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown provider '{body.provider}'. Available: {list(providers.keys())}",
        )

    provider = providers[body.provider]()
    if not provider.is_available():
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{body.provider}' is not available. Check API key configuration.",
        )

    chatbot.set_provider(provider)
    return {"status": "switched", "provider": provider.name}
