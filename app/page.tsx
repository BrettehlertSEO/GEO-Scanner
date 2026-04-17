"use client";

import useSWR from "swr";
import { MessageSquare, AlertTriangle, TrendingUp, Globe, Loader2 } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { MentionCard } from "@/components/mention-card";
import { SentimentPie } from "@/components/charts/sentiment-pie";
import { SentimentTrend } from "@/components/charts/sentiment-trend";
import { DomainBar } from "@/components/charts/domain-bar";
import { formatSentimentScore } from "@/lib/utils";
import type { MentionStats, MentionsResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OverviewPage() {
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<MentionStats>("/api/stats", fetcher);
  const { data: mentionsData, error: mentionsError, isLoading: mentionsLoading } = useSWR<MentionsResponse>(
    "/api/mentions?limit=5",
    fetcher
  );

  const isLoading = statsLoading || mentionsLoading;
  const hasError = statsError || mentionsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError || !stats) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">Failed to load dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const recentMentions = mentionsData?.mentions || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor your brand mentions and sentiment across the web</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Mentions" value={stats.total_mentions} icon={MessageSquare} />
        <KpiCard
          title="Corrections Needed"
          value={stats.corrections_needed}
          subtitle={`${stats.total_mentions > 0 ? ((stats.corrections_needed / stats.total_mentions) * 100).toFixed(1) : 0}% of total`}
          icon={AlertTriangle}
        />
        <KpiCard title="Avg. Sentiment" value={formatSentimentScore(stats.avg_sentiment_score)} icon={TrendingUp} />
        <KpiCard title="Unique Domains" value={stats.top_domains.length} icon={Globe} />
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Sentiment Distribution</h2>
          <SentimentPie data={stats.by_sentiment} />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Top Domains</h2>
          <DomainBar data={stats.top_domains} />
        </div>
      </div>

      {/* Trend Chart */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Sentiment Over Time</h2>
        <SentimentTrend data={stats.sentiment_over_time} />
      </div>

      {/* Recent Mentions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Mentions</h2>
        {recentMentions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No mentions found. Configure your Google Alerts RSS feed to start tracking Rocket Money mentions.</p>
        ) : (
          <div className="space-y-3">
            {recentMentions.map((mention) => (
              <MentionCard key={mention.id} mention={mention} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
