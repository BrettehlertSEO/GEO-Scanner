"""Discover brand mentions via Google Alerts RSS feeds."""

from __future__ import annotations

import logging
from typing import Optional
from urllib.parse import quote_plus, urlparse

import feedparser
import httpx

from geo_scanner.config import Settings

logger = logging.getLogger(__name__)

GOOGLE_ALERTS_RSS_BASE = "https://www.google.com/alerts/feeds/"


class SearchResult:
    """A single mention result from a Google Alerts feed entry."""

    def __init__(self, url: str, title: str, snippet: str, query: str):
        self.url = url
        self.title = title
        self.snippet = snippet
        self.query = query
        self.domain = urlparse(url).netloc

    def __repr__(self) -> str:
        return f"SearchResult(url={self.url!r}, title={self.title!r})"


def build_alert_feed_url(query: str) -> str:
    """
    Build a Google Alerts RSS feed URL for a given query.

    Google Alerts RSS feeds follow the pattern:
        https://www.google.com/alerts/feeds/<id>/...
    But users can also create alerts at https://www.google.com/alerts
    and grab the RSS feed URL from there.

    This helper generates a Google News RSS feed URL as a fallback
    when the user hasn't provided a pre-configured feed URL.
    """
    encoded = quote_plus(query)
    return f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"


def build_default_feed_urls(settings: Settings) -> list[str]:
    """
    Generate default Google News RSS feed URLs based on brand terms.

    These serve as a no-API-key alternative. For better results, users
    should set up actual Google Alerts and paste the RSS feed URLs into
    GOOGLE_ALERTS_FEED_URLS in their .env file.
    """
    urls: list[str] = []
    for term in settings.all_brand_terms:
        urls.append(build_alert_feed_url(f'"{term}"'))
    return urls


async def fetch_feed(url: str, settings: Settings) -> Optional[str]:
    """Download the raw XML content of an RSS feed."""
    headers = {
        "User-Agent": settings.user_agent,
        "Accept": "application/rss+xml, application/xml, text/xml",
    }
    async with httpx.AsyncClient(
        timeout=settings.request_timeout,
        follow_redirects=True,
        headers=headers,
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.text


def parse_feed_entries(
    feed_xml: str, query_label: str
) -> list[SearchResult]:
    """Parse an RSS/Atom feed and extract entries as SearchResult objects."""
    feed = feedparser.parse(feed_xml)
    results: list[SearchResult] = []

    for entry in feed.entries:
        link = entry.get("link", "")
        if not link:
            continue

        title = entry.get("title", "")
        snippet = entry.get("summary", "") or entry.get("description", "")

        # Strip HTML tags from title/snippet (feedparser sometimes leaves them)
        import re
        title = re.sub(r"<[^>]+>", "", title).strip()
        snippet = re.sub(r"<[^>]+>", "", snippet).strip()

        results.append(
            SearchResult(
                url=link,
                title=title,
                snippet=snippet,
                query=query_label,
            )
        )

    return results


async def fetch_and_parse_feed(
    feed_url: str, query_label: str, settings: Settings
) -> list[SearchResult]:
    """Fetch a single RSS feed URL and parse its entries."""
    try:
        xml = await fetch_feed(feed_url, settings)
        if not xml:
            return []
        return parse_feed_entries(xml, query_label)
    except httpx.HTTPStatusError as exc:
        logger.warning("Feed HTTP error for %s: %s", feed_url, exc)
        return []
    except httpx.RequestError as exc:
        logger.warning("Feed network error for %s: %s", feed_url, exc)
        return []


async def discover_mentions(
    settings: Settings,
    *,
    extra_feed_urls: list[str] | None = None,
) -> list[SearchResult]:
    """
    Poll all configured Google Alerts RSS feeds and return deduplicated results.

    Feed sources (in priority order):
    1. Explicit feed URLs from settings.google_alerts_feed_urls
    2. Any extra_feed_urls passed as an argument
    3. Auto-generated Google News RSS feeds based on brand terms (fallback)
    """
    feed_urls: list[tuple[str, str]] = []  # (url, label) pairs

    for url in settings.google_alerts_feed_urls:
        feed_urls.append((url, "google-alert"))

    if extra_feed_urls:
        for url in extra_feed_urls:
            feed_urls.append((url, "extra-feed"))

    if not feed_urls:
        logger.info(
            "No Google Alerts feed URLs configured — using auto-generated "
            "Google News RSS feeds for brand terms."
        )
        for url in build_default_feed_urls(settings):
            feed_urls.append((url, "auto-google-news"))

    seen_urls: set[str] = set()
    all_results: list[SearchResult] = []

    for feed_url, label in feed_urls:
        logger.debug("Fetching feed: %s", feed_url)
        results = await fetch_and_parse_feed(feed_url, label, settings)
        for r in results:
            if r.url not in seen_urls:
                seen_urls.add(r.url)
                all_results.append(r)

        if len(all_results) >= settings.max_results_per_query:
            break

    logger.info("Discovered %d unique mention candidates from %d feed(s).",
                len(all_results), len(feed_urls))
    return all_results
