import type { Mention, MentionStats, Sentiment } from "./types";
import Parser from "rss-parser";

const GOOGLE_ALERTS_RSS_URL = "https://www.google.com/alerts/feeds/03849862949161863884/13814082573011252035";

const parser = new Parser({
  customFields: {
    item: ["content"],
  },
});

// Cache to avoid hitting the RSS feed on every request
let cachedMentions: Mention[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function analyzeSentiment(text: string): { sentiment: Sentiment; score: number } {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    "best", "great", "excellent", "amazing", "love", "helpful", "recommend", "save", "saved", "savings",
    "worth", "useful", "easy", "simple", "effective", "top", "favorite", "impressed", "awesome", "fantastic"
  ];
  const negativeWords = [
    "worst", "bad", "terrible", "hate", "scam", "fraud", "waste", "expensive", "problem", "issue",
    "difficult", "confusing", "disappointing", "avoid", "cancel", "complaint", "annoying", "frustrating"
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { sentiment: "neutral", score: 0.5 };
  }
  
  const score = (positiveCount - negativeCount + total) / (2 * total);
  
  if (positiveCount > negativeCount * 2) {
    return { sentiment: "positive", score: Math.min(0.95, 0.7 + score * 0.25) };
  } else if (negativeCount > positiveCount * 2) {
    return { sentiment: "negative", score: Math.max(0.05, 0.3 - (1 - score) * 0.25) };
  } else if (positiveCount > 0 && negativeCount > 0) {
    return { sentiment: "mixed", score: 0.4 + score * 0.2 };
  }
  
  return { sentiment: "neutral", score: 0.5 };
}

function extractFeatures(text: string): string[] {
  const lowerText = text.toLowerCase();
  const features: string[] = [];
  
  const featureKeywords: Record<string, string> = {
    "subscription": "subscription management",
    "subscriptions": "subscription management",
    "bill": "bill negotiation",
    "negotiate": "bill negotiation",
    "save": "savings tracking",
    "saving": "savings tracking",
    "budget": "budgeting",
    "track": "expense tracking",
    "cancel": "subscription cancellation",
    "premium": "premium features",
    "free": "free tier",
    "bank": "bank integration",
    "plaid": "Plaid integration",
    "privacy": "data privacy",
    "security": "security",
    "app": "mobile app",
    "notification": "notifications",
    "alert": "alerts",
  };
  
  Object.entries(featureKeywords).forEach(([keyword, feature]) => {
    if (lowerText.includes(keyword) && !features.includes(feature)) {
      features.push(feature);
    }
  });
  
  return features.length > 0 ? features : ["general mention"];
}

async function fetchMentionsFromRSS(): Promise<Mention[]> {
  try {
    console.log("[v0] Fetching Google Alerts RSS feed...");
    const feed = await parser.parseURL(GOOGLE_ALERTS_RSS_URL);
    console.log("[v0] Received", feed.items?.length || 0, "items from RSS feed");
    
    const mentions: Mention[] = (feed.items || []).map((item, index) => {
      const title = item.title || "Untitled";
      const url = item.link || "";
      const content = stripHtml(item.content || item.contentSnippet || item.summary || "");
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
      
      const { sentiment, score } = analyzeSentiment(title + " " + content);
      const features = extractFeatures(title + " " + content);
      
      return {
        id: index + 1,
        url,
        domain: extractDomain(url),
        title,
        published_date: new Date(pubDate).toISOString().split("T")[0],
        discovered_at: new Date(pubDate).toISOString(),
        raw_snippet: content,
        relevant_excerpt: content.slice(0, 500),
        sentiment,
        sentiment_score: score,
        features_discussed: features,
        summary: `Mention from ${extractDomain(url)}: ${title}`,
        tone: sentiment === "positive" ? "favorable" : sentiment === "negative" ? "critical" : "neutral",
        reach_out_recommendation: sentiment === "negative" 
          ? "Consider reaching out to address concerns" 
          : sentiment === "positive" 
            ? "Potential testimonial or partnership opportunity" 
            : "Monitor for updates",
        correction_needed: sentiment === "negative",
        search_query: "Rocket Money",
        crawl_success: true,
      };
    });
    
    return mentions;
  } catch (error) {
    console.error("[v0] Error fetching RSS feed:", error);
    return [];
  }
}

async function getCachedMentions(): Promise<Mention[]> {
  const now = Date.now();
  
  if (cachedMentions && (now - cacheTimestamp) < CACHE_TTL) {
    console.log("[v0] Returning cached mentions");
    return cachedMentions;
  }
  
  console.log("[v0] Cache expired or empty, fetching fresh data");
  cachedMentions = await fetchMentionsFromRSS();
  cacheTimestamp = now;
  
  return cachedMentions;
}

export interface GetMentionsOptions {
  sentiment?: Sentiment;
  domain?: string;
  correction_needed?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: "discovered_at" | "sentiment_score" | "domain";
  sort_order?: "asc" | "desc";
}

export async function getMentions(options: GetMentionsOptions = {}): Promise<{ mentions: Mention[]; total: number }> {
  const { sentiment, domain, correction_needed, search, limit = 50, offset = 0, sort_by = "discovered_at", sort_order = "desc" } = options;

  let mentions = await getCachedMentions();

  if (sentiment) {
    mentions = mentions.filter((m) => m.sentiment === sentiment);
  }
  if (domain) {
    mentions = mentions.filter((m) => m.domain === domain);
  }
  if (correction_needed !== undefined) {
    mentions = mentions.filter((m) => m.correction_needed === correction_needed);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    mentions = mentions.filter((m) => m.title.toLowerCase().includes(searchLower) || m.domain.toLowerCase().includes(searchLower));
  }

  // Sort
  mentions.sort((a, b) => {
    let comparison = 0;
    if (sort_by === "discovered_at") {
      comparison = new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime();
    } else if (sort_by === "sentiment_score") {
      comparison = a.sentiment_score - b.sentiment_score;
    } else if (sort_by === "domain") {
      comparison = a.domain.localeCompare(b.domain);
    }
    return sort_order === "asc" ? comparison : -comparison;
  });

  const total = mentions.length;
  const paginated = mentions.slice(offset, offset + limit);

  return { mentions: paginated, total };
}

export async function getMentionById(id: number): Promise<Mention | null> {
  const mentions = await getCachedMentions();
  return mentions.find((m) => m.id === id) || null;
}

export async function getStats(): Promise<MentionStats> {
  const mentions = await getCachedMentions();
  const total = mentions.length;

  if (total === 0) {
    return {
      total_mentions: 0,
      by_sentiment: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
      corrections_needed: 0,
      avg_sentiment_score: 0,
      top_domains: [],
      sentiment_over_time: [],
      feature_coverage: [],
    };
  }

  const by_sentiment: Record<Sentiment, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  mentions.forEach((m) => {
    by_sentiment[m.sentiment]++;
  });

  const corrections = mentions.filter((m) => m.correction_needed).length;

  const avgScore = mentions.reduce((sum, m) => sum + m.sentiment_score, 0) / total;

  // Top domains
  const domainCounts: Record<string, number> = {};
  mentions.forEach((m) => {
    domainCounts[m.domain] = (domainCounts[m.domain] || 0) + 1;
  });
  const top_domains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sentiment over time (group by date)
  const dateMap: Record<string, { positive: number; negative: number; neutral: number; mixed: number }> = {};
  mentions.forEach((m) => {
    const date = m.discovered_at.split("T")[0];
    if (!dateMap[date]) {
      dateMap[date] = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    }
    dateMap[date][m.sentiment]++;
  });
  const sentiment_over_time = Object.entries(dateMap)
    .map(([date, sentiments]) => ({ date, ...sentiments }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Feature coverage
  const featureCounts: Record<string, number> = {};
  mentions.forEach((m) => {
    m.features_discussed.forEach((f) => {
      featureCounts[f] = (featureCounts[f] || 0) + 1;
    });
  });
  const feature_coverage = Object.entries(featureCounts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    total_mentions: total,
    by_sentiment,
    corrections_needed: corrections,
    avg_sentiment_score: avgScore,
    top_domains,
    sentiment_over_time,
    feature_coverage,
  };
}

export async function getDomains(): Promise<string[]> {
  const mentions = await getCachedMentions();
  const domains = [...new Set(mentions.map((m) => m.domain))];
  return domains.sort();
}
