"""SQLite-backed persistence for brand mention records."""

from __future__ import annotations

import json
import logging
import sqlite3
from pathlib import Path
from typing import Optional

from geo_scanner.models import Mention, Sentiment

logger = logging.getLogger(__name__)

SCHEMA = """\
CREATE TABLE IF NOT EXISTS mentions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    url             TEXT UNIQUE NOT NULL,
    domain          TEXT NOT NULL DEFAULT '',
    title           TEXT NOT NULL DEFAULT '',
    published_date  TEXT,
    discovered_at   TEXT NOT NULL,
    raw_snippet     TEXT NOT NULL DEFAULT '',
    relevant_excerpt TEXT NOT NULL DEFAULT '',
    sentiment       TEXT NOT NULL DEFAULT 'neutral',
    sentiment_score REAL NOT NULL DEFAULT 0.0,
    features_discussed TEXT NOT NULL DEFAULT '[]',
    summary         TEXT NOT NULL DEFAULT '',
    tone            TEXT NOT NULL DEFAULT '',
    reach_out_recommendation TEXT NOT NULL DEFAULT '',
    correction_needed INTEGER NOT NULL DEFAULT 0,
    search_query    TEXT NOT NULL DEFAULT '',
    crawl_success   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mentions_domain ON mentions(domain);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_mentions_discovered ON mentions(discovered_at);
"""


class MentionStore:
    """SQLite-backed store for brand mentions."""

    def __init__(self, db_path: str = "geo_scanner.db"):
        self.db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None

    def _connect(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
            self._conn.executescript(SCHEMA)
        return self._conn

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None

    def url_exists(self, url: str) -> bool:
        conn = self._connect()
        row = conn.execute("SELECT 1 FROM mentions WHERE url = ?", (url,)).fetchone()
        return row is not None

    def save_mention(self, mention: Mention) -> int:
        conn = self._connect()
        try:
            cursor = conn.execute(
                """
                INSERT INTO mentions (
                    url, domain, title, published_date, discovered_at,
                    raw_snippet, relevant_excerpt, sentiment, sentiment_score,
                    features_discussed, summary, tone,
                    reach_out_recommendation, correction_needed,
                    search_query, crawl_success
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mention.url,
                    mention.domain,
                    mention.title,
                    mention.published_date,
                    mention.discovered_at,
                    mention.raw_snippet,
                    mention.relevant_excerpt,
                    mention.sentiment.value,
                    mention.sentiment_score,
                    json.dumps(mention.features_discussed),
                    mention.summary,
                    mention.tone,
                    mention.reach_out_recommendation,
                    1 if mention.correction_needed else 0,
                    mention.search_query,
                    1 if mention.crawl_success else 0,
                ),
            )
            conn.commit()
            return cursor.lastrowid or 0
        except sqlite3.IntegrityError:
            logger.debug("URL already stored: %s", mention.url)
            return 0

    def update_mention(self, mention: Mention) -> None:
        conn = self._connect()
        conn.execute(
            """
            UPDATE mentions SET
                title = ?, published_date = ?, raw_snippet = ?,
                relevant_excerpt = ?, sentiment = ?, sentiment_score = ?,
                features_discussed = ?, summary = ?, tone = ?,
                reach_out_recommendation = ?, correction_needed = ?,
                crawl_success = ?
            WHERE url = ?
            """,
            (
                mention.title,
                mention.published_date,
                mention.raw_snippet,
                mention.relevant_excerpt,
                mention.sentiment.value,
                mention.sentiment_score,
                json.dumps(mention.features_discussed),
                mention.summary,
                mention.tone,
                mention.reach_out_recommendation,
                1 if mention.correction_needed else 0,
                1 if mention.crawl_success else 0,
                mention.url,
            ),
        )
        conn.commit()

    def get_all_mentions(
        self,
        *,
        sentiment: Optional[str] = None,
        domain: Optional[str] = None,
        correction_needed: Optional[bool] = None,
        limit: int = 100,
    ) -> list[Mention]:
        conn = self._connect()
        query = "SELECT * FROM mentions WHERE 1=1"
        params: list = []

        if sentiment:
            query += " AND sentiment = ?"
            params.append(sentiment)
        if domain:
            query += " AND domain LIKE ?"
            params.append(f"%{domain}%")
        if correction_needed is not None:
            query += " AND correction_needed = ?"
            params.append(1 if correction_needed else 0)

        query += " ORDER BY discovered_at DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
        return [self._row_to_mention(row) for row in rows]

    def get_mention_by_url(self, url: str) -> Optional[Mention]:
        conn = self._connect()
        row = conn.execute("SELECT * FROM mentions WHERE url = ?", (url,)).fetchone()
        if row:
            return self._row_to_mention(row)
        return None

    def get_stats(self) -> dict:
        conn = self._connect()
        total = conn.execute("SELECT COUNT(*) FROM mentions").fetchone()[0]
        by_sentiment = {}
        for row in conn.execute(
            "SELECT sentiment, COUNT(*) as cnt FROM mentions GROUP BY sentiment"
        ).fetchall():
            by_sentiment[row["sentiment"]] = row["cnt"]

        corrections = conn.execute(
            "SELECT COUNT(*) FROM mentions WHERE correction_needed = 1"
        ).fetchone()[0]

        top_domains = []
        for row in conn.execute(
            "SELECT domain, COUNT(*) as cnt FROM mentions GROUP BY domain ORDER BY cnt DESC LIMIT 10"
        ).fetchall():
            top_domains.append({"domain": row["domain"], "count": row["cnt"]})

        return {
            "total_mentions": total,
            "by_sentiment": by_sentiment,
            "corrections_needed": corrections,
            "top_domains": top_domains,
        }

    @staticmethod
    def _row_to_mention(row: sqlite3.Row) -> Mention:
        features = json.loads(row["features_discussed"]) if row["features_discussed"] else []
        return Mention(
            id=row["id"],
            url=row["url"],
            domain=row["domain"],
            title=row["title"],
            published_date=row["published_date"],
            discovered_at=row["discovered_at"],
            raw_snippet=row["raw_snippet"],
            relevant_excerpt=row["relevant_excerpt"],
            sentiment=Sentiment(row["sentiment"]),
            sentiment_score=row["sentiment_score"],
            features_discussed=features,
            summary=row["summary"],
            tone=row["tone"],
            reach_out_recommendation=row["reach_out_recommendation"],
            correction_needed=bool(row["correction_needed"]),
            search_query=row["search_query"],
            crawl_success=bool(row["crawl_success"]),
        )
