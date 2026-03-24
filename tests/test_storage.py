"""Tests for the SQLite storage layer."""

import os
import tempfile

import pytest

from geo_scanner.models import Mention, Sentiment
from geo_scanner.storage import MentionStore


@pytest.fixture
def store():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    s = MentionStore(db_path=path)
    yield s
    s.close()
    os.unlink(path)


def test_save_and_retrieve(store: MentionStore):
    m = Mention(
        url="https://example.com/review",
        domain="example.com",
        title="Test Review",
        sentiment=Sentiment.POSITIVE,
        sentiment_score=0.9,
        features_discussed=["bill negotiation"],
        summary="Great product!",
        crawl_success=True,
    )
    row_id = store.save_mention(m)
    assert row_id > 0

    retrieved = store.get_mention_by_url("https://example.com/review")
    assert retrieved is not None
    assert retrieved.title == "Test Review"
    assert retrieved.sentiment == Sentiment.POSITIVE
    assert retrieved.features_discussed == ["bill negotiation"]


def test_url_exists(store: MentionStore):
    m = Mention(url="https://example.com/a")
    store.save_mention(m)
    assert store.url_exists("https://example.com/a")
    assert not store.url_exists("https://example.com/b")


def test_duplicate_url(store: MentionStore):
    m = Mention(url="https://example.com/dup")
    store.save_mention(m)
    row_id = store.save_mention(m)
    assert row_id == 0


def test_update_mention(store: MentionStore):
    m = Mention(url="https://example.com/update", title="Old Title")
    store.save_mention(m)

    m.title = "New Title"
    m.sentiment = Sentiment.NEGATIVE
    m.sentiment_score = -0.5
    store.update_mention(m)

    updated = store.get_mention_by_url("https://example.com/update")
    assert updated is not None
    assert updated.title == "New Title"
    assert updated.sentiment == Sentiment.NEGATIVE


def test_filter_by_sentiment(store: MentionStore):
    store.save_mention(Mention(url="https://a.com/1", sentiment=Sentiment.POSITIVE))
    store.save_mention(Mention(url="https://b.com/2", sentiment=Sentiment.NEGATIVE))
    store.save_mention(Mention(url="https://c.com/3", sentiment=Sentiment.POSITIVE))

    positives = store.get_all_mentions(sentiment="positive")
    assert len(positives) == 2


def test_stats(store: MentionStore):
    store.save_mention(
        Mention(url="https://a.com/1", domain="a.com", sentiment=Sentiment.POSITIVE)
    )
    store.save_mention(
        Mention(
            url="https://b.com/2",
            domain="b.com",
            sentiment=Sentiment.NEGATIVE,
            correction_needed=True,
        )
    )

    stats = store.get_stats()
    assert stats["total_mentions"] == 2
    assert stats["corrections_needed"] == 1
    assert "positive" in stats["by_sentiment"]
