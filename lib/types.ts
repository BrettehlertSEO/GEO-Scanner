export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

export interface Mention {
  id: number;
  url: string;
  domain: string;
  title: string;
  published_date: string | null;
  discovered_at: string;
  raw_snippet: string;
  relevant_excerpt: string;
  sentiment: Sentiment;
  sentiment_score: number;
  features_discussed: string[];
  summary: string;
  tone: string;
  reach_out_recommendation: string;
  correction_needed: boolean;
  search_query: string;
  crawl_success: boolean;
}

export interface MentionStats {
  total_mentions: number;
  by_sentiment: Record<Sentiment, number>;
  corrections_needed: number;
  avg_sentiment_score: number;
  top_domains: { domain: string; count: number }[];
  sentiment_over_time: { date: string; positive: number; negative: number; neutral: number; mixed: number }[];
  feature_coverage: { feature: string; count: number }[];
}

export interface MentionsResponse {
  mentions: Mention[];
  total: number;
  limit: number;
  offset: number;
}
