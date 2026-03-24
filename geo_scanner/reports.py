"""Rich terminal output and report generation."""

from __future__ import annotations

import csv
import io
import json
from typing import TextIO

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from geo_scanner.models import Mention, Sentiment

console = Console()

SENTIMENT_COLORS = {
    Sentiment.POSITIVE: "green",
    Sentiment.NEGATIVE: "red",
    Sentiment.NEUTRAL: "yellow",
    Sentiment.MIXED: "cyan",
}


def print_mention_table(mentions: list[Mention]) -> None:
    """Display mentions in a Rich table."""
    if not mentions:
        console.print("[dim]No mentions to display.[/dim]")
        return

    table = Table(
        title="Brand Mentions",
        show_lines=True,
        title_style="bold magenta",
    )
    table.add_column("#", style="dim", width=4)
    table.add_column("Domain", style="cyan", max_width=25)
    table.add_column("Title", max_width=40)
    table.add_column("Sentiment", width=10)
    table.add_column("Score", width=6)
    table.add_column("Features", max_width=30)
    table.add_column("Correction?", width=11)

    for i, m in enumerate(mentions, 1):
        color = SENTIMENT_COLORS.get(m.sentiment, "white")
        features = ", ".join(m.features_discussed[:3])
        if len(m.features_discussed) > 3:
            features += "..."
        correction = "[red]YES[/red]" if m.correction_needed else "[green]No[/green]"

        table.add_row(
            str(i),
            m.domain,
            m.title[:40],
            f"[{color}]{m.sentiment.value}[/{color}]",
            f"{m.sentiment_score:+.2f}",
            features,
            correction,
        )

    console.print(table)


def print_mention_detail(mention: Mention) -> None:
    """Print a detailed view of a single mention."""
    color = SENTIMENT_COLORS.get(mention.sentiment, "white")

    console.print(
        Panel(
            f"[bold]{mention.title}[/bold]\n"
            f"[link={mention.url}]{mention.url}[/link]\n"
            f"Domain: [cyan]{mention.domain}[/cyan]  |  "
            f"Published: {mention.published_date or 'Unknown'}  |  "
            f"Discovered: {mention.discovered_at[:10]}\n\n"
            f"[bold]Sentiment:[/bold] [{color}]{mention.sentiment.value}[/{color}] "
            f"(score: {mention.sentiment_score:+.2f})  |  "
            f"Tone: {mention.tone}\n\n"
            f"[bold]Summary:[/bold]\n{mention.summary}\n\n"
            f"[bold]Key Excerpt:[/bold]\n[italic]{mention.relevant_excerpt}[/italic]\n\n"
            f"[bold]Features Discussed:[/bold] {', '.join(mention.features_discussed) or 'None identified'}\n\n"
            f"[bold]Outreach Recommendation:[/bold]\n{mention.reach_out_recommendation}\n\n"
            f"[bold]Correction Needed:[/bold] "
            f"{'[red]YES[/red]' if mention.correction_needed else '[green]No[/green]'}",
            title="Mention Detail",
            border_style="blue",
        )
    )


def print_stats(stats: dict) -> None:
    """Display aggregate statistics."""
    console.print(Panel(
        f"[bold]Total Mentions:[/bold] {stats['total_mentions']}\n"
        f"[bold]Corrections Needed:[/bold] [red]{stats['corrections_needed']}[/red]\n\n"
        f"[bold]By Sentiment:[/bold]",
        title="Dashboard",
        border_style="magenta",
    ))

    if stats["by_sentiment"]:
        table = Table(show_header=True)
        table.add_column("Sentiment")
        table.add_column("Count", justify="right")
        for sent, count in stats["by_sentiment"].items():
            color = SENTIMENT_COLORS.get(Sentiment(sent), "white")
            table.add_row(f"[{color}]{sent}[/{color}]", str(count))
        console.print(table)

    if stats["top_domains"]:
        dt = Table(title="Top Domains", show_header=True)
        dt.add_column("Domain")
        dt.add_column("Mentions", justify="right")
        for d in stats["top_domains"]:
            dt.add_row(d["domain"], str(d["count"]))
        console.print(dt)


def export_csv(mentions: list[Mention], output: TextIO | None = None) -> str:
    """Export mentions as CSV. Returns the CSV string."""
    buf = output or io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "URL", "Domain", "Title", "Published", "Discovered",
        "Sentiment", "Score", "Features", "Summary",
        "Excerpt", "Tone", "Outreach Recommendation",
        "Correction Needed",
    ])
    for m in mentions:
        writer.writerow([
            m.url, m.domain, m.title, m.published_date or "",
            m.discovered_at[:10], m.sentiment.value, f"{m.sentiment_score:+.2f}",
            "; ".join(m.features_discussed), m.summary,
            m.relevant_excerpt, m.tone, m.reach_out_recommendation,
            "Yes" if m.correction_needed else "No",
        ])
    if output is None:
        return buf.getvalue()
    return ""


def export_json(mentions: list[Mention]) -> str:
    """Export mentions as JSON string."""
    data = [m.model_dump(mode="json") for m in mentions]
    return json.dumps(data, indent=2, default=str)
