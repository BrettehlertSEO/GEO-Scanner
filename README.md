# GEO-Scanner

**Brand Mention Monitoring & Sentiment Analysis for AI/LLM Visibility**

GEO-Scanner discovers when publications mention your brand (default: **Rocket Money**), crawls the content, and uses an LLM to analyze sentiment, features discussed, and whether outreach or correction is needed. The goal is to stay on top of how your brand is represented across the web — content that directly influences what AI models say about you.

---

## Why This Matters

Large Language Models are trained on web content. When a publication writes about your brand — positively, negatively, or inaccurately — that content shapes how AI systems describe your product to millions of users. GEO-Scanner gives you:

- **Early detection** of new brand mentions across publications
- **Sentiment analysis** so you know the tone at a glance
- **Feature tracking** to see which product capabilities get coverage
- **Correction flags** when articles contain factual errors
- **Outreach recommendations** with actionable suggestions for engaging publications

---

## Architecture

```
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Discovery     │────▶│   Crawler    │────▶│   Analyzer   │────▶│   Storage    │
│ (Google Alerts   │     │ (trafilatura)│     │  (OpenAI)    │     │  (SQLite)    │
│  RSS Feeds)      │     │              │     │              │     │              │
└──────────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
         │                                                                │
         └──────────────────── CLI / Reports (Rich) ◀─────────────────────┘
```

| Module | Responsibility |
|---|---|
| `discovery.py` | Polls Google Alerts RSS feeds (or auto-generated Google News RSS), deduplicates results |
| `crawler.py` | Fetches pages, extracts article text via trafilatura, isolates brand-relevant passages |
| `analyzer.py` | Sends passages to an LLM for structured sentiment/feature/summary analysis |
| `storage.py` | Persists mention records in SQLite with full query/filter support |
| `pipeline.py` | Orchestrates the full scan flow with async concurrency |
| `reports.py` | Rich terminal tables, detailed views, CSV/JSON export |
| `cli.py` | Click-based CLI with `scan`, `check`, `list`, `detail`, `stats`, `export`, `feeds` commands |

---

## Quick Start

### 1. Install

```bash
pip install -e ".[dev]"
```

### 2. Configure

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required keys:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for LLM analysis |

Optional (but recommended):

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_ALERTS_FEED_URLS` | *(empty)* | Comma-separated Google Alerts RSS feed URLs (see setup below) |
| `BRAND_NAME` | `Rocket Money` | Primary brand name to monitor |
| `BRAND_ALIASES` | `RocketMoney,Rocket Money app` | Comma-separated alternate names |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used for analysis |
| `MAX_RESULTS_PER_QUERY` | `20` | Cap on total results per scan |
| `DATABASE_PATH` | `geo_scanner.db` | SQLite database file path |
| `REQUEST_TIMEOUT` | `30` | HTTP request timeout in seconds |

**No Google API key required.** If you don't configure `GOOGLE_ALERTS_FEED_URLS`, GEO-Scanner automatically generates Google News RSS feeds based on your brand terms as a zero-config fallback.

### 3. Run a Scan

```bash
geo-scanner scan
```

This will:
1. Poll Google Alerts RSS feeds (or auto-generated Google News feeds) for new brand mentions
2. Crawl each discovered page and extract article content
3. Identify passages that reference the brand
4. Analyze each mention with an LLM for sentiment, features, and recommendations
5. Store everything in the local SQLite database
6. Display a summary table in the terminal

---

## Setting Up Google Alerts (Recommended)

Google Alerts gives you the best coverage for brand monitoring — it continuously monitors the web and notifies you via RSS when new content appears.

1. Go to [Google Alerts](https://www.google.com/alerts)
2. Create alerts for your brand terms:
   - `"Rocket Money"`
   - `"Rocket Money" review`
   - `"Rocket Money" vs`
   - `"RocketMoney"`
3. For each alert, click **Show options** and set **Deliver to** → **RSS feed**
4. Copy the RSS feed URL for each alert
5. Paste all feed URLs (comma-separated) into `GOOGLE_ALERTS_FEED_URLS` in your `.env` file:

```
GOOGLE_ALERTS_FEED_URLS=https://www.google.com/alerts/feeds/abc123/...,https://www.google.com/alerts/feeds/def456/...
```

To see your current feed configuration:

```bash
geo-scanner feeds
```

---

## CLI Commands

### `scan` — Run a full brand mention scan

```bash
geo-scanner scan                          # Poll configured feeds
geo-scanner scan -f https://...rss_url    # Add an extra feed for this scan
geo-scanner scan -c 5                     # 5 concurrent crawl tasks
```

### `check` — Scan a single URL

```bash
geo-scanner check https://example.com/rocket-money-review
```

### `list` — Browse stored mentions

```bash
geo-scanner list                          # All mentions
geo-scanner list -s negative              # Only negative sentiment
geo-scanner list -d nerdwallet.com        # Filter by domain
geo-scanner list --corrections            # Only those needing correction
geo-scanner list -n 100                   # Show up to 100 results
```

### `detail` — View full analysis for a URL

```bash
geo-scanner detail https://example.com/rocket-money-review
```

### `stats` — Aggregate dashboard

```bash
geo-scanner stats
```

### `export` — Export to CSV or JSON

```bash
geo-scanner export -f csv -o mentions.csv
geo-scanner export -f json -o mentions.json
geo-scanner export -f csv -s positive     # Export only positive mentions
```

### `feeds` — View feed configuration

```bash
geo-scanner feeds
```

### Global Options

```bash
geo-scanner -v scan      # Verbose/debug logging
```

---

## What the LLM Analyzes

For each mention, the analyzer returns structured data:

| Field | Description |
|---|---|
| **Sentiment** | `positive`, `negative`, `neutral`, or `mixed` |
| **Sentiment Score** | Float from -1.0 (very negative) to +1.0 (very positive) |
| **Features Discussed** | List of product features/aspects mentioned (e.g., "bill negotiation", "subscription tracking") |
| **Summary** | 2-3 sentence overview of how the brand is discussed |
| **Tone** | Descriptive word(s) for the article's tone (e.g., "enthusiastic", "critical") |
| **Key Excerpt** | The most important sentence about the brand, quoted verbatim |
| **Outreach Recommendation** | Actionable suggestion for engaging the publication |
| **Correction Needed** | Boolean flag if factual errors were detected |

---

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run with debug logging
geo-scanner -v scan
```

---

## Project Structure

```
geo_scanner/
├── __init__.py        # Package version
├── config.py          # Settings from environment/.env
├── models.py          # Pydantic domain models (Mention, AnalysisResult)
├── discovery.py       # Google Alerts RSS feed polling & parsing
├── crawler.py         # Page fetching & content extraction
├── analyzer.py        # LLM-powered sentiment & feature analysis
├── storage.py         # SQLite persistence layer
├── pipeline.py        # Async orchestration of the full scan flow
├── reports.py         # Rich terminal output & CSV/JSON export
└── cli.py             # Click CLI entry point
tests/
├── test_config.py
├── test_crawler.py
├── test_discovery.py
├── test_models.py
└── test_storage.py
```
