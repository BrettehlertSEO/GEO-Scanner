"""Discover brand mentions via web search APIs."""

from __future__ import annotations

import logging
from typing import Optional
from urllib.parse import urlparse

import httpx

from geo_scanner.config import Settings

logger = logging.getLogger(__name__)


class SearchResult:
    """A single search result before full crawling."""

    def __init__(self, url: str, title: str, snippet: str, query: str):
        self.url = url
        self.title = title
        self.snippet = snippet
        self.query = query
        self.domain = urlparse(url).netloc

    def __repr__(self) -> str:
        return f"SearchResult(url={self.url!r}, title={self.title!r})"


async def google_custom_search(
    query: str,
    settings: Settings,
    *,
    num: int = 10,
    start: int = 1,
    date_restrict: Optional[str] = None,
) -> list[SearchResult]:
    """
    Query the Google Custom Search JSON API.

    Args:
        query: The search query string.
        settings: Application settings (must have google_api_key and google_cse_id).
        num: Number of results to request (max 10 per call).
        start: Result offset for pagination.
        date_restrict: Optional date restriction, e.g. "d7" for past 7 days.

    Returns:
        A list of SearchResult objects.
    """
    if not settings.google_api_key or not settings.google_cse_id:
        logger.warning("Google API credentials not configured – skipping Google search.")
        return []

    params: dict[str, str | int] = {
        "key": settings.google_api_key,
        "cx": settings.google_cse_id,
        "q": query,
        "num": min(num, 10),
        "start": start,
    }
    if date_restrict:
        params["dateRestrict"] = date_restrict

    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        resp = await client.get(
            "https://www.googleapis.com/customsearch/v1", params=params
        )
        resp.raise_for_status()
        data = resp.json()

    results: list[SearchResult] = []
    for item in data.get("items", []):
        results.append(
            SearchResult(
                url=item.get("link", ""),
                title=item.get("title", ""),
                snippet=item.get("snippet", ""),
                query=query,
            )
        )
    return results


def build_search_queries(settings: Settings, extra_terms: list[str] | None = None) -> list[str]:
    """
    Build a list of search queries to discover brand mentions.

    Generates queries like:
      - "Rocket Money" review
      - "Rocket Money" vs
      - "Rocket Money" article
    """
    suffixes = [
        "review",
        "vs",
        "comparison",
        "article",
        "best budgeting app",
        "alternative",
        "opinion",
        "mention",
    ]

    queries: list[str] = []
    for term in settings.all_brand_terms:
        quoted = f'"{term}"'
        queries.append(quoted)
        for suffix in suffixes:
            queries.append(f"{quoted} {suffix}")

    if extra_terms:
        for term in extra_terms:
            queries.append(term)

    return queries


async def discover_mentions(
    settings: Settings,
    *,
    date_restrict: Optional[str] = "m1",
    extra_queries: list[str] | None = None,
) -> list[SearchResult]:
    """
    Run all search queries and return deduplicated results.

    Args:
        settings: Application settings.
        date_restrict: Date restriction for recency (default: past month).
        extra_queries: Optional additional queries to run.
    """
    queries = build_search_queries(settings, extra_queries)
    seen_urls: set[str] = set()
    all_results: list[SearchResult] = []

    for query in queries:
        if len(all_results) >= settings.max_results_per_query:
            break
        try:
            results = await google_custom_search(
                query, settings, date_restrict=date_restrict
            )
            for r in results:
                if r.url not in seen_urls:
                    seen_urls.add(r.url)
                    all_results.append(r)
        except httpx.HTTPStatusError as exc:
            logger.warning("Search API error for query %r: %s", query, exc)
        except httpx.RequestError as exc:
            logger.warning("Network error for query %r: %s", query, exc)

    logger.info("Discovered %d unique mention candidates.", len(all_results))
    return all_results
