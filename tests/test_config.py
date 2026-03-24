"""Tests for configuration."""

from geo_scanner.config import Settings


def test_settings_defaults():
    s = Settings()
    assert s.brand_name == "Rocket Money"
    assert "RocketMoney" in s.brand_aliases
    assert s.google_alerts_feed_urls == []


def test_all_brand_terms():
    s = Settings(brand_name="Rocket Money", brand_aliases=["RM", "RocketMoney"])
    terms = s.all_brand_terms
    assert terms[0] == "Rocket Money"
    assert "RM" in terms
    assert "RocketMoney" in terms
    assert len(terms) == 3


def test_all_brand_terms_dedup():
    s = Settings(brand_name="Rocket Money", brand_aliases=["Rocket Money", "RM"])
    terms = s.all_brand_terms
    assert terms.count("Rocket Money") == 1


def test_settings_with_feed_urls():
    s = Settings(
        google_alerts_feed_urls=[
            "https://www.google.com/alerts/feeds/abc123",
            "https://www.google.com/alerts/feeds/def456",
        ]
    )
    assert len(s.google_alerts_feed_urls) == 2
