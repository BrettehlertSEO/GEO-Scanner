"""Tests for Google Alerts RSS feed discovery."""

from geo_scanner.config import Settings
from geo_scanner.discovery import (
    SearchResult,
    build_alert_feed_url,
    build_default_feed_urls,
    parse_feed_entries,
)

SAMPLE_RSS = """\
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google Alert - "Rocket Money"</title>
    <link>https://www.google.com/alerts/feeds/</link>
    <item>
      <title>Rocket Money Review 2026: Is It Worth It?</title>
      <link>https://example.com/rocket-money-review</link>
      <description>A detailed review of Rocket Money and its features.</description>
    </item>
    <item>
      <title>Best Budgeting Apps: Rocket Money vs YNAB</title>
      <link>https://example.com/budgeting-apps-comparison</link>
      <description>Comparing the top budgeting apps including &lt;b&gt;Rocket Money&lt;/b&gt;.</description>
    </item>
    <item>
      <title>No link entry</title>
    </item>
  </channel>
</rss>
"""

SAMPLE_ATOM = """\
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Google Alert - Rocket Money</title>
  <entry>
    <title>Rocket Money Raises Series C</title>
    <link href="https://techcrunch.example.com/rocket-money-series-c" />
    <summary>Rocket Money has raised a new round of funding.</summary>
  </entry>
</feed>
"""


def test_build_alert_feed_url():
    url = build_alert_feed_url('"Rocket Money"')
    assert "news.google.com/rss/search" in url
    assert "Rocket" in url


def test_build_default_feed_urls():
    settings = Settings(brand_name="Rocket Money", brand_aliases=["RocketMoney"])
    urls = build_default_feed_urls(settings)
    assert len(urls) == 2
    assert all("news.google.com" in u for u in urls)


def test_parse_rss_feed():
    results = parse_feed_entries(SAMPLE_RSS, "test-alert")
    assert len(results) == 2  # third item has no link, should be skipped
    assert results[0].url == "https://example.com/rocket-money-review"
    assert results[0].title == "Rocket Money Review 2026: Is It Worth It?"
    assert results[0].query == "test-alert"
    assert results[0].domain == "example.com"


def test_parse_rss_strips_html_from_snippet():
    results = parse_feed_entries(SAMPLE_RSS, "test")
    comparison = results[1]
    assert "<b>" not in comparison.snippet
    assert "Rocket Money" in comparison.snippet


def test_parse_atom_feed():
    results = parse_feed_entries(SAMPLE_ATOM, "atom-alert")
    assert len(results) == 1
    assert "techcrunch" in results[0].url
    assert results[0].title == "Rocket Money Raises Series C"


def test_build_default_feeds_dedup():
    settings = Settings(brand_name="Rocket Money", brand_aliases=["Rocket Money"])
    urls = build_default_feed_urls(settings)
    assert len(urls) == 1


def test_search_result_domain_parsing():
    r = SearchResult(
        url="https://www.nerdwallet.com/article/rocket-money",
        title="Test",
        snippet="Snippet",
        query="q",
    )
    assert r.domain == "www.nerdwallet.com"
