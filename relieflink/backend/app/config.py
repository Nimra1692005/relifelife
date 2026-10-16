"""
ReliefLink — Configuration
"""

from pydantic_settings import BaseSettings
from typing import List, Union
import json


class Settings(BaseSettings):
    # ─── App ────────────────────────────────────────────
    app_name: str = "ReliefLink API"
    environment: str = "development"
    debug: bool = True

    # ─── Supabase (old format: anon/service keys) ───────
    supabase_url: str = ""
    supabase_key: str = ""           # anon key OR sb_publishable_
    supabase_service_key: str = ""   # service_role OR sb_secret_

    # ─── Supabase (new format: sb_publishable / sb_secret) ─
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    supabase_jwks_url: str = ""

    # ─── OpenAI ─────────────────────────────────────────
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # ─── Weather Intelligence ────────────────────────────
    weather_provider: str = "mock"  # mock | openweathermap | weatherapi
    weather_api_key: str = ""

    # ─── Admin access ───────────────────────────────────
    admin_emails: str = ""  # comma-separated, e.g. "me@gmail.com,boss@gmail.com"

    # ─── CORS ───────────────────────────────────────────
    cors_origins: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "https://relifelife.vercel.app",
    ]

    # ─── Rate Limiting ──────────────────────────────────
    rate_limit_per_minute: int = 60
    sos_rate_limit_per_minute: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from env (supports JSON string or list)."""
        if isinstance(self.cors_origins, str):
            try:
                return json.loads(self.cors_origins)
            except (json.JSONDecodeError, TypeError):
                return [o.strip() for o in self.cors_origins.split(",")]
        return self.cors_origins

    @property
    def admin_email_list(self) -> List[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]

    @property
    def effective_supabase_key(self) -> str:
        """Return whichever key format is available."""
        return self.supabase_publishable_key or self.supabase_key

    @property
    def effective_service_key(self) -> str:
        """Return whichever service key format is available."""
        return self.supabase_secret_key or self.supabase_service_key or self.supabase_key


settings = Settings()
