"""Tests for search query building."""

from geo_scanner.config import Settings
from geo_scanner.discovery import build_search_queries


def test_build_queries_default():
    settings = Settings(brand_name="Rocket Money", brand_aliases=["RocketMoney"])
    queries = build_search_queries(settings)
    assert any('"Rocket Money"' in q for q in queries)
    assert any('"RocketMoney"' in q for q in queries)
    assert any("review" in q for q in queries)
    assert any("comparison" in q for q in queries)


def test_build_queries_extra_terms():
    settings = Settings(brand_name="TestBrand", brand_aliases=[])
    queries = build_search_queries(settings, extra_terms=["custom query"])
    assert "custom query" in queries


def test_build_queries_no_duplicates_in_terms():
    settings = Settings(brand_name="Rocket Money", brand_aliases=["Rocket Money"])
    terms = settings.all_brand_terms
    assert terms.count("Rocket Money") == 1
