"""Crawl and extract article content from discovered URLs."""

from __future__ import annotations

import logging
from typing import Optional

import httpx
import trafilatura

from geo_scanner.config import Settings

logger = logging.getLogger(__name__)

EXCLUDED_DOMAINS = {
    "youtube.com",
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "reddit.com",
    "linkedin.com",
}


def _is_excluded(domain: str) -> bool:
    return any(domain.endswith(d) for d in EXCLUDED_DOMAINS)


async def fetch_page(url: str, settings: Settings) -> Optional[str]:
    """Download the raw HTML of a page."""
    headers = {
        "User-Agent": settings.user_agent,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    async with httpx.AsyncClient(
        timeout=settings.request_timeout,
        follow_redirects=True,
        headers=headers,
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.text


def extract_content(html: str, url: str) -> dict[str, Optional[str]]:
    """
    Extract main article text and metadata from raw HTML using trafilatura.

    Returns a dict with keys: text, title, date, author, sitename.
    """
    text = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_tables=True,
        favor_recall=True,
        output_format="txt",
    )
    metadata = trafilatura.extract_metadata(html, default_url=url)

    result: dict[str, Optional[str]] = {"text": text}
    if metadata:
        result["title"] = metadata.title
        result["date"] = metadata.date
        result["author"] = metadata.author
        result["sitename"] = metadata.sitename
    else:
        result["title"] = None
        result["date"] = None
        result["author"] = None
        result["sitename"] = None

    return result


def find_brand_passages(
    text: str, brand_terms: list[str], context_chars: int = 500
) -> list[str]:
    """
    Find passages in the article text that mention any of the brand terms.

    Returns a list of text excerpts (surrounding context around each mention).
    """
    if not text:
        return []

    text_lower = text.lower()
    passages: list[str] = []
    used_ranges: list[tuple[int, int]] = []

    for term in brand_terms:
        start = 0
        term_lower = term.lower()
        while True:
            idx = text_lower.find(term_lower, start)
            if idx == -1:
                break

            ctx_start = max(0, idx - context_chars)
            ctx_end = min(len(text), idx + len(term) + context_chars)

            overlaps = False
            for rs, re_ in used_ranges:
                if ctx_start < re_ and ctx_end > rs:
                    overlaps = True
                    break

            if not overlaps:
                passages.append(text[ctx_start:ctx_end].strip())
                used_ranges.append((ctx_start, ctx_end))

            start = idx + len(term)

    return passages


async def crawl_url(
    url: str, domain: str, settings: Settings
) -> Optional[dict]:
    """
    Crawl a single URL, extract content, and identify brand-relevant passages.

    Returns a dict with extracted article data and brand passages, or None on failure.
    """
    if _is_excluded(domain):
        logger.info("Skipping excluded domain: %s", domain)
        return None

    try:
        html = await fetch_page(url, settings)
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.warning("Failed to fetch %s: %s", url, exc)
        return None

    if not html:
        return None

    extracted = extract_content(html, url)
    if not extracted.get("text"):
        logger.info("No article text extracted from %s", url)
        return None

    passages = find_brand_passages(extracted["text"], settings.all_brand_terms)
    if not passages:
        logger.info("No brand mentions found in article text for %s", url)
        return None

    return {
        "text": extracted["text"],
        "title": extracted.get("title", ""),
        "date": extracted.get("date"),
        "author": extracted.get("author"),
        "sitename": extracted.get("sitename"),
        "passages": passages,
    }
