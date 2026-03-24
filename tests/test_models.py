"""Tests for domain models."""

from geo_scanner.models import AnalysisResult, Mention, Sentiment


def test_mention_defaults():
    m = Mention(url="https://example.com/article")
    assert m.url == "https://example.com/article"
    assert m.sentiment == Sentiment.NEUTRAL
    assert m.features_discussed == []
    assert m.crawl_success is False
    assert m.correction_needed is False


def test_mention_with_full_data():
    m = Mention(
        url="https://example.com/review",
        domain="example.com",
        title="Rocket Money Review",
        sentiment=Sentiment.POSITIVE,
        sentiment_score=0.85,
        features_discussed=["bill negotiation", "subscription tracking"],
        summary="Positive review of the app.",
        correction_needed=False,
        crawl_success=True,
    )
    assert m.sentiment == Sentiment.POSITIVE
    assert len(m.features_discussed) == 2
    assert m.crawl_success is True


def test_analysis_result_validation():
    result = AnalysisResult(
        sentiment=Sentiment.NEGATIVE,
        sentiment_score=-0.7,
        features_discussed=["budgeting"],
        summary="Critical take on the product.",
        tone="critical",
        relevant_excerpt="Rocket Money falls short...",
        reach_out_recommendation="Address the criticism.",
        correction_needed=True,
    )
    assert result.sentiment_score == -0.7
    assert result.correction_needed is True
