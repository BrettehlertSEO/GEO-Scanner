"""Command-line interface for GEO-Scanner."""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

from geo_scanner.config import get_settings
from geo_scanner.discovery import build_alert_feed_url
from geo_scanner.reports import (
    console,
    export_csv,
    export_json,
    print_mention_detail,
    print_mention_table,
    print_stats,
)
from geo_scanner.storage import MentionStore

logger = logging.getLogger("geo_scanner")


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


@click.group()
@click.option("-v", "--verbose", is_flag=True, help="Enable debug logging.")
@click.pass_context
def cli(ctx: click.Context, verbose: bool) -> None:
    """GEO-Scanner: Brand Mention Monitoring & Sentiment Analysis."""
    _setup_logging(verbose)
    ctx.ensure_object(dict)
    ctx.obj["settings"] = get_settings()
    ctx.obj["store"] = MentionStore(ctx.obj["settings"].database_path)


@cli.command()
@click.option(
    "--feed", "-f", multiple=True,
    help="Additional RSS feed URL(s) to poll (Google Alerts or Google News RSS).",
)
@click.option(
    "--concurrency", "-c", default=3, help="Max concurrent crawl/analysis tasks."
)
@click.pass_context
def scan(
    ctx: click.Context,
    feed: tuple[str, ...],
    concurrency: int,
) -> None:
    """Run a full brand mention scan: poll feeds, crawl, analyze, and store."""
    from geo_scanner.pipeline import run_scan

    settings = ctx.obj["settings"]
    store = ctx.obj["store"]

    console.print(
        f"[bold magenta]Starting GEO-Scanner for:[/bold magenta] "
        f"[cyan]{settings.brand_name}[/cyan]"
    )

    if settings.google_alerts_feed_urls:
        console.print(
            f"[dim]Using {len(settings.google_alerts_feed_urls)} configured "
            f"Google Alerts feed(s)[/dim]"
        )
    else:
        console.print(
            "[dim]No Google Alerts feeds configured — using auto-generated "
            "Google News RSS feeds[/dim]"
        )

    extra = list(feed) if feed else None
    mentions = asyncio.run(
        run_scan(
            settings,
            store,
            extra_feed_urls=extra,
            concurrency=concurrency,
        )
    )

    if mentions:
        print_mention_table(mentions)
        corrections = [m for m in mentions if m.correction_needed]
        if corrections:
            console.print(
                f"\n[bold red]⚠ {len(corrections)} mention(s) may need correction![/bold red]"
            )
    else:
        console.print("[dim]No new mentions found in this scan.[/dim]")

    store.close()


@cli.command()
@click.argument("url")
@click.pass_context
def check(ctx: click.Context, url: str) -> None:
    """Scan a single URL for brand mentions."""
    from geo_scanner.pipeline import scan_single_url

    settings = ctx.obj["settings"]
    store = ctx.obj["store"]

    console.print(f"[bold]Scanning:[/bold] {url}")
    mention = asyncio.run(scan_single_url(url, settings, store))

    if mention and mention.crawl_success:
        print_mention_detail(mention)
    elif mention:
        console.print("[yellow]Page was fetched but no brand mentions were found.[/yellow]")
    else:
        console.print("[red]Failed to process this URL.[/red]")

    store.close()


@cli.command(name="list")
@click.option("--sentiment", "-s", type=click.Choice(["positive", "negative", "neutral", "mixed"]))
@click.option("--domain", "-d", help="Filter by domain substring.")
@click.option("--corrections", is_flag=True, help="Show only mentions needing correction.")
@click.option("--limit", "-n", default=50, help="Max results to show.")
@click.pass_context
def list_mentions(
    ctx: click.Context,
    sentiment: str | None,
    domain: str | None,
    corrections: bool,
    limit: int,
) -> None:
    """List stored brand mentions with optional filters."""
    store = ctx.obj["store"]
    mentions = store.get_all_mentions(
        sentiment=sentiment,
        domain=domain,
        correction_needed=True if corrections else None,
        limit=limit,
    )
    print_mention_table(mentions)
    store.close()


@cli.command()
@click.argument("url")
@click.pass_context
def detail(ctx: click.Context, url: str) -> None:
    """Show detailed analysis for a specific mention URL."""
    store = ctx.obj["store"]
    mention = store.get_mention_by_url(url)
    if mention:
        print_mention_detail(mention)
    else:
        console.print(f"[red]No stored mention found for: {url}[/red]")
    store.close()


@cli.command()
@click.pass_context
def stats(ctx: click.Context) -> None:
    """Show aggregate statistics across all stored mentions."""
    store = ctx.obj["store"]
    data = store.get_stats()
    print_stats(data)
    store.close()


@cli.command()
@click.option("--format", "-f", "fmt", type=click.Choice(["csv", "json"]), default="csv")
@click.option("--output", "-o", type=click.Path(), help="Output file path.")
@click.option("--sentiment", "-s", type=click.Choice(["positive", "negative", "neutral", "mixed"]))
@click.pass_context
def export(
    ctx: click.Context,
    fmt: str,
    output: str | None,
    sentiment: str | None,
) -> None:
    """Export stored mentions to CSV or JSON."""
    store = ctx.obj["store"]
    mentions = store.get_all_mentions(sentiment=sentiment, limit=10000)

    if fmt == "csv":
        content = export_csv(mentions)
    else:
        content = export_json(mentions)

    if output:
        Path(output).write_text(content)
        console.print(f"[green]Exported {len(mentions)} mentions to {output}[/green]")
    else:
        click.echo(content)

    store.close()


@cli.command()
@click.pass_context
def feeds(ctx: click.Context) -> None:
    """Show configured feed URLs and auto-generated fallback feeds."""
    settings = ctx.obj["settings"]

    table = Table(title="Feed Configuration", show_lines=True)
    table.add_column("Source", style="cyan")
    table.add_column("URL", max_width=80)

    if settings.google_alerts_feed_urls:
        for url in settings.google_alerts_feed_urls:
            table.add_row("Google Alert", url)
    else:
        console.print(
            "[yellow]No Google Alerts feed URLs configured in "
            "GOOGLE_ALERTS_FEED_URLS.[/yellow]\n"
        )

    console.print(table)

    console.print("\n[bold]Auto-generated fallback feeds (Google News RSS):[/bold]")
    fallback_table = Table(show_lines=True)
    fallback_table.add_column("Brand Term", style="cyan")
    fallback_table.add_column("Feed URL", max_width=80)
    for term in settings.all_brand_terms:
        fallback_table.add_row(term, build_alert_feed_url(f'"{term}"'))
    console.print(fallback_table)

    console.print(
        "\n[dim]To use Google Alerts instead, visit https://www.google.com/alerts, "
        "create alerts for your brand terms, enable 'RSS feed' delivery, then paste "
        "the feed URLs into GOOGLE_ALERTS_FEED_URLS in your .env file.[/dim]"
    )


def main() -> None:
    cli()


if __name__ == "__main__":
    main()
