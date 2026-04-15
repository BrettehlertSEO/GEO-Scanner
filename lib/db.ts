import type { Mention, MentionStats, Sentiment } from "./types";

// Demo data for the GEO Scanner dashboard
// In production, this would connect to a real database (Supabase, Neon, etc.)

const demoMentions: Mention[] = [
  {
    id: 1,
    url: "https://techcrunch.com/2026/04/10/ai-tools-comparison",
    domain: "techcrunch.com",
    title: "The Best AI Tools for Business in 2026",
    published_date: "2026-04-10",
    discovered_at: "2026-04-10T14:30:00Z",
    raw_snippet: "Among the top contenders, GEO Scanner stands out for its comprehensive brand monitoring capabilities...",
    relevant_excerpt: "GEO Scanner offers real-time brand mention tracking across multiple platforms, making it an essential tool for PR teams.",
    sentiment: "positive",
    sentiment_score: 0.85,
    features_discussed: ["brand monitoring", "real-time tracking", "PR tools"],
    summary: "Featured as a top AI tool for business brand monitoring with emphasis on real-time capabilities.",
    tone: "professional",
    reach_out_recommendation: "Consider reaching out for a case study collaboration.",
    correction_needed: false,
    search_query: "GEO Scanner review",
    crawl_success: true,
  },
  {
    id: 2,
    url: "https://www.g2.com/products/geo-scanner/reviews",
    domain: "g2.com",
    title: "GEO Scanner Reviews 2026",
    published_date: "2026-04-08",
    discovered_at: "2026-04-08T09:15:00Z",
    raw_snippet: "Users praise the intuitive dashboard but note that pricing could be more competitive...",
    relevant_excerpt: "Great tool for tracking brand mentions. The sentiment analysis is accurate, though the enterprise tier is pricey.",
    sentiment: "mixed",
    sentiment_score: 0.45,
    features_discussed: ["dashboard", "sentiment analysis", "pricing"],
    summary: "Mixed review highlighting strong features but concerns about enterprise pricing.",
    tone: "balanced",
    reach_out_recommendation: "Address pricing concerns in response. Consider offering a discount.",
    correction_needed: false,
    search_query: "GEO Scanner reviews",
    crawl_success: true,
  },
  {
    id: 3,
    url: "https://reddit.com/r/marketing/comments/abc123",
    domain: "reddit.com",
    title: "Has anyone tried GEO Scanner for competitor analysis?",
    published_date: "2026-04-05",
    discovered_at: "2026-04-05T18:45:00Z",
    raw_snippet: "I've been using it for 3 months and the competitor tracking feature is game-changing...",
    relevant_excerpt: "The competitor analysis dashboard shows exactly where your brand is mentioned alongside competitors. Super useful for positioning.",
    sentiment: "positive",
    sentiment_score: 0.78,
    features_discussed: ["competitor analysis", "brand positioning", "dashboard"],
    summary: "Positive user testimonial focusing on competitor tracking capabilities.",
    tone: "casual",
    reach_out_recommendation: "Engage with this thread to provide additional tips.",
    correction_needed: false,
    search_query: "GEO Scanner competitor",
    crawl_success: true,
  },
  {
    id: 4,
    url: "https://www.forbes.com/sites/tech/2026/04/01/brand-monitoring-tools",
    domain: "forbes.com",
    title: "Top 10 Brand Monitoring Tools for 2026",
    published_date: "2026-04-01",
    discovered_at: "2026-04-01T11:00:00Z",
    raw_snippet: "GEO Scanner rounds out our top 10 list with its AI-powered sentiment analysis...",
    relevant_excerpt: "While not the cheapest option, GEO Scanner offers robust AI-powered sentiment analysis that rivals more established competitors.",
    sentiment: "neutral",
    sentiment_score: 0.55,
    features_discussed: ["AI sentiment analysis", "brand monitoring"],
    summary: "Included in Forbes top 10 list with moderate praise.",
    tone: "professional",
    reach_out_recommendation: "Reach out to author for a deeper feature piece.",
    correction_needed: false,
    search_query: "brand monitoring tools 2026",
    crawl_success: true,
  },
  {
    id: 5,
    url: "https://twitter.com/marketingpro/status/123456789",
    domain: "twitter.com",
    title: "@marketingpro tweet about GEO Scanner",
    published_date: "2026-04-12",
    discovered_at: "2026-04-12T16:20:00Z",
    raw_snippet: "Just discovered GEO Scanner and it's already found 50+ mentions I was missing!",
    relevant_excerpt: "Just discovered GEO Scanner and it's already found 50+ mentions I was missing! 🔥 Game changer for brand monitoring.",
    sentiment: "positive",
    sentiment_score: 0.92,
    features_discussed: ["mention discovery", "brand monitoring"],
    summary: "Enthusiastic endorsement on social media about discovery capabilities.",
    tone: "enthusiastic",
    reach_out_recommendation: "Retweet and thank the user.",
    correction_needed: false,
    search_query: "GEO Scanner twitter",
    crawl_success: true,
  },
  {
    id: 6,
    url: "https://blog.competitor.com/why-we-switched-from-geo-scanner",
    domain: "competitor.com",
    title: "Why We Switched From GEO Scanner",
    published_date: "2026-03-28",
    discovered_at: "2026-03-28T10:30:00Z",
    raw_snippet: "While GEO Scanner has solid features, we found the reporting limited for our enterprise needs...",
    relevant_excerpt: "The reporting features in GEO Scanner couldn't handle our scale. We needed more customization options for our 50+ brand portfolio.",
    sentiment: "negative",
    sentiment_score: 0.25,
    features_discussed: ["reporting", "enterprise scale", "customization"],
    summary: "Competitor blog post highlighting limitations in enterprise reporting.",
    tone: "critical",
    reach_out_recommendation: "Document feedback for product team. Consider reaching out to understand specific needs.",
    correction_needed: true,
    search_query: "GEO Scanner enterprise",
    crawl_success: true,
  },
  {
    id: 7,
    url: "https://www.producthunt.com/products/geo-scanner",
    domain: "producthunt.com",
    title: "GEO Scanner - AI-powered brand monitoring",
    published_date: "2026-03-15",
    discovered_at: "2026-03-15T08:00:00Z",
    raw_snippet: "Launched on Product Hunt with 500+ upvotes! Great tool for startups...",
    relevant_excerpt: "Finally an affordable brand monitoring tool for startups! The AI suggestions are spot on.",
    sentiment: "positive",
    sentiment_score: 0.88,
    features_discussed: ["startup-friendly", "AI suggestions", "affordability"],
    summary: "Successful Product Hunt launch with strong community response.",
    tone: "enthusiastic",
    reach_out_recommendation: "Follow up with top commenters for testimonials.",
    correction_needed: false,
    search_query: "GEO Scanner product hunt",
    crawl_success: true,
  },
  {
    id: 8,
    url: "https://www.capterra.com/p/geo-scanner/reviews",
    domain: "capterra.com",
    title: "GEO Scanner Reviews on Capterra",
    published_date: "2026-04-02",
    discovered_at: "2026-04-02T13:45:00Z",
    raw_snippet: "4.2/5 stars from 127 reviews. Users love the interface but want better integrations...",
    relevant_excerpt: "Love the clean interface and accurate sentiment detection. Would be 5 stars if it had Slack integration.",
    sentiment: "mixed",
    sentiment_score: 0.62,
    features_discussed: ["interface", "sentiment detection", "integrations"],
    summary: "Strong Capterra rating with requests for more integrations.",
    tone: "balanced",
    reach_out_recommendation: "Announce Slack integration when available.",
    correction_needed: false,
    search_query: "GEO Scanner Capterra",
    crawl_success: true,
  },
  {
    id: 9,
    url: "https://medium.com/@prexpert/brand-crisis-management",
    domain: "medium.com",
    title: "How I Used GEO Scanner to Navigate a Brand Crisis",
    published_date: "2026-03-20",
    discovered_at: "2026-03-20T15:30:00Z",
    raw_snippet: "When negative press hit, GEO Scanner helped us identify and respond to mentions in real-time...",
    relevant_excerpt: "The real-time alerts were crucial during our crisis. We could respond to negative coverage within minutes instead of hours.",
    sentiment: "positive",
    sentiment_score: 0.82,
    features_discussed: ["real-time alerts", "crisis management", "response time"],
    summary: "Case study on using the product for crisis management.",
    tone: "professional",
    reach_out_recommendation: "Request permission to feature as a case study.",
    correction_needed: false,
    search_query: "GEO Scanner crisis",
    crawl_success: true,
  },
  {
    id: 10,
    url: "https://news.ycombinator.com/item?id=987654",
    domain: "news.ycombinator.com",
    title: "Ask HN: Best tools for brand monitoring?",
    published_date: "2026-04-11",
    discovered_at: "2026-04-11T20:00:00Z",
    raw_snippet: "GEO Scanner was mentioned multiple times. Some concerns about data privacy...",
    relevant_excerpt: "I use GEO Scanner but I'm curious about their data retention policy. Anyone know if they're GDPR compliant?",
    sentiment: "neutral",
    sentiment_score: 0.50,
    features_discussed: ["data privacy", "GDPR", "data retention"],
    summary: "HN discussion with privacy-related questions.",
    tone: "inquisitive",
    reach_out_recommendation: "Post official response about GDPR compliance and data policies.",
    correction_needed: true,
    search_query: "GEO Scanner HN",
    crawl_success: true,
  },
];

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

  let filtered = [...demoMentions];

  if (sentiment) {
    filtered = filtered.filter((m) => m.sentiment === sentiment);
  }
  if (domain) {
    filtered = filtered.filter((m) => m.domain === domain);
  }
  if (correction_needed !== undefined) {
    filtered = filtered.filter((m) => m.correction_needed === correction_needed);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((m) => m.title.toLowerCase().includes(searchLower) || m.domain.toLowerCase().includes(searchLower));
  }

  // Sort
  filtered.sort((a, b) => {
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

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return { mentions: paginated, total };
}

export async function getMentionById(id: number): Promise<Mention | null> {
  return demoMentions.find((m) => m.id === id) || null;
}

export async function getStats(): Promise<MentionStats> {
  const total = demoMentions.length;

  const by_sentiment: Record<Sentiment, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  demoMentions.forEach((m) => {
    by_sentiment[m.sentiment]++;
  });

  const corrections = demoMentions.filter((m) => m.correction_needed).length;

  const avgScore = demoMentions.reduce((sum, m) => sum + m.sentiment_score, 0) / total;

  // Top domains
  const domainCounts: Record<string, number> = {};
  demoMentions.forEach((m) => {
    domainCounts[m.domain] = (domainCounts[m.domain] || 0) + 1;
  });
  const top_domains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sentiment over time (group by date)
  const dateMap: Record<string, { positive: number; negative: number; neutral: number; mixed: number }> = {};
  demoMentions.forEach((m) => {
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
  demoMentions.forEach((m) => {
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
  const domains = [...new Set(demoMentions.map((m) => m.domain))];
  return domains.sort();
}
