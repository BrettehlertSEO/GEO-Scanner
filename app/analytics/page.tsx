import { getStats } from "@/lib/db";
import { SentimentPie } from "@/components/charts/sentiment-pie";
import { SentimentTrend } from "@/components/charts/sentiment-trend";
import { DomainBar } from "@/components/charts/domain-bar";
import { FeaturesBar } from "@/components/charts/features-bar";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const stats = getStats();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your brand mentions and sentiment trends</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Mentions</p>
          <p className="text-3xl font-bold">{stats.total_mentions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Positive Mentions</p>
          <p className="text-3xl font-bold text-positive">{stats.by_sentiment.positive}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Negative Mentions</p>
          <p className="text-3xl font-bold text-negative">{stats.by_sentiment.negative}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Corrections Needed</p>
          <p className="text-3xl font-bold text-destructive">{stats.corrections_needed}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sentiment Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Sentiment Distribution</h2>
          <SentimentPie data={stats.by_sentiment} />
        </div>

        {/* Top Domains */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Top Domains</h2>
          <DomainBar data={stats.top_domains} />
        </div>

        {/* Sentiment Over Time */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Sentiment Trend Over Time</h2>
          <SentimentTrend data={stats.sentiment_over_time} />
        </div>

        {/* Feature Coverage */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Feature Coverage</h2>
          <p className="text-sm text-muted-foreground mb-4">Most frequently discussed product features across all mentions</p>
          <FeaturesBar data={stats.feature_coverage} />
        </div>
      </div>

      {/* Domain Breakdown Table */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Domain Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium text-right">Mentions</th>
                <th className="pb-3 font-medium text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_domains.map((domain, index) => (
                <tr key={domain.domain} className="border-b border-border/50 last:border-0">
                  <td className="py-3">
                    <span className="mr-3 text-muted-foreground">{index + 1}.</span>
                    <span className="font-mono text-sm">{domain.domain}</span>
                  </td>
                  <td className="py-3 text-right font-medium">{domain.count}</td>
                  <td className="py-3 text-right text-muted-foreground">
                    {((domain.count / stats.total_mentions) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
