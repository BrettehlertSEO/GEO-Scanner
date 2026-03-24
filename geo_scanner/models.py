"""Domain models for brand mention records."""

from __future__ import annotations

import datetime as dt
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class Mention(BaseModel):
    """A single brand mention discovered from a publication."""

    id: Optional[int] = None
    url: str
    domain: str = ""
    title: str = ""
    published_date: Optional[str] = None
    discovered_at: str = Field(
        default_factory=lambda: dt.datetime.now(dt.timezone.utc).isoformat()
    )

    # Extracted content
    raw_snippet: str = ""
    relevant_excerpt: str = ""

    # LLM analysis results
    sentiment: Sentiment = Sentiment.NEUTRAL
    sentiment_score: float = 0.0
    features_discussed: list[str] = Field(default_factory=list)
    summary: str = ""
    tone: str = ""
    reach_out_recommendation: str = ""
    correction_needed: bool = False

    # Metadata
    search_query: str = ""
    crawl_success: bool = False


class AnalysisResult(BaseModel):
    """Structured output from the LLM analysis step."""

    sentiment: Sentiment
    sentiment_score: float = Field(ge=-1.0, le=1.0)
    features_discussed: list[str]
    summary: str
    tone: str
    relevant_excerpt: str
    reach_out_recommendation: str
    correction_needed: bool
