"""Centralized configuration loaded from environment / .env file."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
    brand_name: str = Field(default="Rocket Money")
    brand_aliases: list[str] = Field(default_factory=lambda: ["RocketMoney", "Rocket Money app"])

    google_api_key: str = Field(default="")
    google_cse_id: str = Field(default="")

    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4o-mini")

    max_results_per_query: int = Field(default=20)
    database_path: str = Field(default="geo_scanner.db")

    request_timeout: int = Field(default=30)
    user_agent: str = Field(default="GEO-Scanner/0.1")

    @property
    def all_brand_terms(self) -> list[str]:
        """Return the primary brand name plus all aliases."""
        terms = [self.brand_name]
        for alias in self.brand_aliases:
            if alias and alias not in terms:
                terms.append(alias)
        return terms


def get_settings() -> Settings:
    aliases_raw = os.getenv("BRAND_ALIASES", "RocketMoney,Rocket Money app")
    aliases = [a.strip() for a in aliases_raw.split(",") if a.strip()]

    return Settings(
        brand_name=os.getenv("BRAND_NAME", "Rocket Money"),
        brand_aliases=aliases,
        google_api_key=os.getenv("GOOGLE_API_KEY", ""),
        google_cse_id=os.getenv("GOOGLE_CSE_ID", ""),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        max_results_per_query=int(os.getenv("MAX_RESULTS_PER_QUERY", "20")),
        database_path=os.getenv("DATABASE_PATH", "geo_scanner.db"),
        request_timeout=int(os.getenv("REQUEST_TIMEOUT", "30")),
        user_agent=os.getenv("USER_AGENT", "GEO-Scanner/0.1"),
    )
