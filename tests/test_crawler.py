"""Tests for content extraction and brand passage detection."""

from geo_scanner.crawler import find_brand_passages, extract_content


def test_find_brand_passages_single():
    text = (
        "There are many budgeting apps available today. "
        "Rocket Money is one of the most popular options for tracking "
        "subscriptions and saving money. The app has millions of users."
    )
    passages = find_brand_passages(text, ["Rocket Money"])
    assert len(passages) == 1
    assert "Rocket Money" in passages[0]


def test_find_brand_passages_multiple_terms():
    text = (
        "Rocket Money offers bill negotiation. "
        "Some users prefer the RocketMoney app for its simplicity."
    )
    passages = find_brand_passages(text, ["Rocket Money", "RocketMoney"])
    assert len(passages) >= 1


def test_find_brand_passages_no_match():
    text = "This article discusses budgeting tips and has nothing relevant."
    passages = find_brand_passages(text, ["Rocket Money"])
    assert len(passages) == 0


def test_find_brand_passages_case_insensitive():
    text = "Users love rocket money for subscription cancellation."
    passages = find_brand_passages(text, ["Rocket Money"])
    assert len(passages) == 1


def test_extract_content_with_html():
    html = """
    <html>
    <head><title>Test Article</title></head>
    <body>
    <article>
        <h1>Rocket Money Review 2024</h1>
        <p>Rocket Money is a personal finance app that helps users track
        subscriptions, negotiate bills, and manage their budgets effectively.
        The app has been downloaded millions of times and continues to grow
        in popularity among budget-conscious consumers.</p>
        <p>One of the standout features is the bill negotiation service,
        where Rocket Money's team negotiates lower rates on your behalf
        for things like cable, internet, and phone bills.</p>
    </article>
    </body>
    </html>
    """
    result = extract_content(html, "https://example.com/review")
    assert result.get("text") is not None or result.get("title") is not None


def test_find_brand_passages_context_window():
    prefix = "x" * 600
    suffix = "y" * 600
    text = f"{prefix} Rocket Money is great. {suffix}"
    passages = find_brand_passages(text, ["Rocket Money"], context_chars=100)
    assert len(passages) == 1
    assert len(passages[0]) < len(text)
