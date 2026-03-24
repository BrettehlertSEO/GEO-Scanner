"""Orchestrates the full scan pipeline: discover -> crawl -> analyze -> store."""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

from geo_scanner.analyzer import analyze_mention
from geo_scanner.config import Settings
from geo_scanner.crawler import crawl_url
from geo_scanner.discovery import SearchResult, discover_mentions
from geo_scanner.models import Mention
from geo_scanner.storage import MentionStore

logger = logging.getLogger(__name__)


async def process_single_result(
    result: SearchResult,
    settings: Settings,
    store: MentionStore,
) -> Optional[Mention]:
    """Process a single search result through crawl -> analyze -> store."""
    if store.url_exists(result.url):
        logger.debug("Already processed: %s", result.url)
        return None

    mention = Mention(
        url=result.url,
        domain=result.domain,
        title=result.title,
        raw_snippet=result.snippet,
        search_query=result.query,
    )
    store.save_mention(mention)

    crawl_data = await crawl_url(result.url, result.domain, settings)
    if not crawl_data:
        logger.info("Crawl yielded no usable content for %s", result.url)
        return mention

    mention.crawl_success = True
    mention.title = crawl_data.get("title") or result.title
    mention.published_date = crawl_data.get("date")

    passages = crawl_data.get("passages", [])
    if not passages:
        store.update_mention(mention)
        return mention

    analysis = await analyze_mention(
        url=result.url,
        title=mention.title,
        sitename=crawl_data.get("sitename") or result.domain,
        passages=passages,
        settings=settings,
    )

    mention.sentiment = analysis.sentiment
    mention.sentiment_score = analysis.sentiment_score
    mention.features_discussed = analysis.features_discussed
    mention.summary = analysis.summary
    mention.tone = analysis.tone
    mention.relevant_excerpt = analysis.relevant_excerpt
    mention.reach_out_recommendation = analysis.reach_out_recommendation
    mention.correction_needed = analysis.correction_needed

    store.update_mention(mention)
    logger.info(
        "Processed: %s [%s, score=%.2f]",
        result.url,
        analysis.sentiment.value,
        analysis.sentiment_score,
    )
    return mention


async def run_scan(
    settings: Settings,
    store: MentionStore,
    *,
    date_restrict: Optional[str] = "m1",
    extra_queries: list[str] | None = None,
    concurrency: int = 3,
) -> list[Mention]:
    """
    Run a full brand mention scan.

    1. Discover mention candidates via search.
    2. Crawl each URL and extract content.
    3. Analyze brand-relevant passages with an LLM.
    4. Store results in the database.
    """
    results = await discover_mentions(
        settings, date_restrict=date_restrict, extra_queries=extra_queries
    )

    if not results:
        logger.info("No new mention candidates found.")
        return []

    semaphore = asyncio.Semaphore(concurrency)
    mentions: list[Mention] = []

    async def _process(r: SearchResult) -> None:
        async with semaphore:
            mention = await process_single_result(r, settings, store)
            if mention:
                mentions.append(mention)

    tasks = [_process(r) for r in results]
    await asyncio.gather(*tasks, return_exceptions=True)

    logger.info("Scan complete. Processed %d mentions.", len(mentions))
    return mentions


async def scan_single_url(
    url: str,
    settings: Settings,
    store: MentionStore,
) -> Optional[Mention]:
    """Scan a single URL (useful for ad-hoc checks)."""
    from urllib.parse import urlparse

    domain = urlparse(url).netloc
    result = SearchResult(url=url, title="", snippet="", query="manual")
    result.domain = domain
    return await process_single_result(result, settings, store)
