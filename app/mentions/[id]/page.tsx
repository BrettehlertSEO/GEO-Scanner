import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, AlertTriangle, Calendar, Globe, MessageSquare } from "lucide-react";
import { getMentionById } from "@/lib/db";
import { SentimentBadge } from "@/components/sentiment-badge";
import { formatDate, formatSentimentScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MentionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MentionDetailPage({ params }: MentionDetailPageProps) {
  const { id } = await params;
  const mentionId = parseInt(id, 10);

  if (isNaN(mentionId)) {
    notFound();
  }

  const mention = getMentionById(mentionId);

  if (!mention) {
    notFound();
  }

  return (
    <div className="p-8">
      <Link href="/mentions" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Mentions
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold mb-2">{mention.title || "Untitled Mention"}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span className="font-mono">{mention.domain}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(mention.discovered_at)}
                  </span>
                </div>
              </div>
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View Article <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {mention.correction_needed && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/30 px-4 py-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Correction Needed</p>
                  <p className="text-sm opacity-90">This article contains inaccurate information that should be addressed.</p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              Summary
            </h2>
            <p className="text-muted-foreground leading-relaxed">{mention.summary || "No summary available."}</p>
          </div>

          {/* Relevant Excerpt */}
          {mention.relevant_excerpt && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Relevant Excerpt</h2>
              <blockquote className="border-l-4 border-primary pl-4 text-muted-foreground italic">
                {mention.relevant_excerpt}
              </blockquote>
            </div>
          )}

          {/* Reach Out Recommendation */}
          {mention.reach_out_recommendation && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Outreach Recommendation</h2>
              <p className="text-muted-foreground leading-relaxed">{mention.reach_out_recommendation}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sentiment Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Sentiment Analysis</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sentiment</span>
                <SentimentBadge sentiment={mention.sentiment} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-mono font-medium">{formatSentimentScore(mention.sentiment_score)}</span>
              </div>
              {/* Sentiment Bar */}
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      mention.sentiment_score >= 0 ? "bg-positive" : "bg-negative"
                    }`}
                    style={{
                      width: `${Math.abs(mention.sentiment_score) * 50 + 50}%`,
                      marginLeft: mention.sentiment_score < 0 ? `${50 + mention.sentiment_score * 50}%` : "50%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-100%</span>
                  <span>0%</span>
                  <span>+100%</span>
                </div>
              </div>
              {mention.tone && (
                <div>
                  <span className="text-sm text-muted-foreground">Tone</span>
                  <p className="font-medium capitalize">{mention.tone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Features Discussed */}
          {mention.features_discussed.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Features Discussed</h2>
              <div className="flex flex-wrap gap-2">
                {mention.features_discussed.map((feature, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Metadata</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Search Query</dt>
                <dd className="font-mono text-xs mt-1">{mention.search_query}</dd>
              </div>
              {mention.published_date && (
                <div>
                  <dt className="text-muted-foreground">Published</dt>
                  <dd>{formatDate(mention.published_date)}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Crawl Status</dt>
                <dd className={mention.crawl_success ? "text-positive" : "text-negative"}>
                  {mention.crawl_success ? "Success" : "Failed"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
