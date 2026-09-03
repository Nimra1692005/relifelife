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

    # ─── Supabase ───────────────────────────────────────
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""

    # ─── OpenAI ─────────────────────────────────────────
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # ─── Weather Intelligence ────────────────────────────
    weather_provider: str = "mock"  # mock | openweathermap | weatherapi
    weather_api_key: str = ""

    # ─── CORS ───────────────────────────────────────────
    cors_origins: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "exp://localhost:8081",
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


settings = Settings()
