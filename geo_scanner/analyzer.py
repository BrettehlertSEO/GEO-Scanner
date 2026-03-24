"""LLM-powered analysis of brand mention content."""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from geo_scanner.config import Settings
from geo_scanner.models import AnalysisResult, Sentiment

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a brand monitoring analyst for **{brand_name}**.

Your job is to analyze article excerpts that mention the brand, and produce a
structured JSON analysis. Be precise and factual.

Respond ONLY with valid JSON matching this schema (no markdown fences):
{{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentiment_score": <float from -1.0 (very negative) to 1.0 (very positive)>,
  "features_discussed": [<list of product features or aspects mentioned>],
  "summary": "<2-3 sentence summary of how the brand is discussed>",
  "tone": "<one or two words describing the article's tone, e.g. 'enthusiastic', 'critical', 'balanced'>",
  "relevant_excerpt": "<the single most important sentence or phrase about the brand, quoted verbatim>",
  "reach_out_recommendation": "<brief suggestion: why and how the brand team should engage with this publication>",
  "correction_needed": <true if the article contains factual errors about the brand, false otherwise>
}}
"""

USER_PROMPT = """\
Article URL: {url}
Article Title: {title}
Publication / Site: {sitename}

--- Excerpts mentioning {brand_name} ---
{passages}
---

Analyze how this article discusses {brand_name}. Identify sentiment, features
discussed, and whether outreach or correction is warranted.
"""


async def analyze_mention(
    url: str,
    title: str,
    sitename: str,
    passages: list[str],
    settings: Settings,
) -> AnalysisResult:
    """
    Use an LLM to analyze brand mention passages and return structured results.
    """
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not configured – returning default analysis.")
        return AnalysisResult(
            sentiment=Sentiment.NEUTRAL,
            sentiment_score=0.0,
            features_discussed=[],
            summary="Analysis unavailable – no OpenAI API key configured.",
            tone="unknown",
            relevant_excerpt=passages[0][:200] if passages else "",
            reach_out_recommendation="Configure OpenAI API key to enable analysis.",
            correction_needed=False,
        )

    combined_passages = "\n\n".join(passages[:5])

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT.format(brand_name=settings.brand_name),
                },
                {
                    "role": "user",
                    "content": USER_PROMPT.format(
                        url=url,
                        title=title,
                        sitename=sitename or "Unknown",
                        brand_name=settings.brand_name,
                        passages=combined_passages,
                    ),
                },
            ],
        )

        raw = response.choices[0].message.content or ""
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

        data = json.loads(raw)
        return AnalysisResult(**data)

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON response: %s", exc)
        return _fallback_result(passages)
    except Exception as exc:
        logger.error("LLM analysis failed: %s", exc)
        return _fallback_result(passages)


def _fallback_result(passages: list[str]) -> AnalysisResult:
    return AnalysisResult(
        sentiment=Sentiment.NEUTRAL,
        sentiment_score=0.0,
        features_discussed=[],
        summary="Automated analysis failed – manual review recommended.",
        tone="unknown",
        relevant_excerpt=passages[0][:200] if passages else "",
        reach_out_recommendation="Manual review needed.",
        correction_needed=False,
    )
