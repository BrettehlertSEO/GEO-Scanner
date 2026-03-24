"""FastAPI web application for GEO-Scanner dashboard."""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from geo_scanner.config import get_settings
from geo_scanner.models import Mention
from geo_scanner.pipeline import run_scan
from geo_scanner.storage import MentionStore

logger = logging.getLogger(__name__)

settings = get_settings()
STATIC_DIR = Path(__file__).parent / "static"


def get_store() -> MentionStore:
    return MentionStore(settings.database_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    store = get_store()
    store.close()
    yield


app = FastAPI(
    title="GEO-Scanner",
    description="Brand Mention Monitoring & Sentiment Analysis Dashboard",
    lifespan=lifespan,
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------

@app.get("/api/mentions")
async def api_mentions(
    sentiment: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    corrections: Optional[bool] = Query(None),
    limit: int = Query(200),
):
    store = get_store()
    try:
        mentions = store.get_all_mentions(
            sentiment=sentiment,
            domain=domain,
            correction_needed=corrections,
            limit=limit,
        )
        return [m.model_dump(mode="json") for m in mentions]
    finally:
        store.close()


@app.get("/api/mentions/detail")
async def api_mention_detail(url: str = Query(...)):
    store = get_store()
    try:
        mention = store.get_mention_by_url(url)
        if not mention:
            return JSONResponse({"error": "Not found"}, status_code=404)
        return mention.model_dump(mode="json")
    finally:
        store.close()


@app.get("/api/stats")
async def api_stats():
    store = get_store()
    try:
        return store.get_stats()
    finally:
        store.close()


@app.get("/api/config")
async def api_config():
    return {
        "brand_name": settings.brand_name,
        "brand_aliases": settings.brand_aliases,
        "feeds_configured": len(settings.google_alerts_feed_urls),
        "scan_interval_hours": settings.scan_interval_hours,
        "openai_model": settings.openai_model,
    }


def _run_scan_task():
    """Background task to run a scan."""
    store = get_store()
    try:
        asyncio.run(run_scan(settings, store))
    except Exception as exc:
        logger.error("Background scan failed: %s", exc)
    finally:
        store.close()


@app.post("/api/scan")
async def api_trigger_scan(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_scan_task)
    return {"status": "Scan started in background"}


# ---------------------------------------------------------------------------
# Dashboard HTML
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    html_path = STATIC_DIR / "index.html"
    if html_path.exists():
        return HTMLResponse(html_path.read_text())
    return HTMLResponse("<h1>GEO-Scanner</h1><p>Static files not found.</p>")
