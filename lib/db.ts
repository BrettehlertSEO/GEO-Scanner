import type { Mention, MentionStats, Sentiment } from "./types";

// Demo data for tracking Rocket Money brand mentions
// In production, this would connect to a real database (Supabase, Neon, etc.)
// and pull from Google Alerts RSS feeds

const demoMentions: Mention[] = [
  {
    id: 1,
    url: "https://www.nerdwallet.com/article/finance/rocket-money-review",
    domain: "nerdwallet.com",
    title: "Rocket Money Review 2026: Is It Worth It?",
    published_date: "2026-04-10",
    discovered_at: "2026-04-10T14:30:00Z",
    raw_snippet: "Rocket Money has become one of the most popular subscription management apps, helping users save an average of $720 per year...",
    relevant_excerpt: "Rocket Money excels at finding forgotten subscriptions and negotiating bills on your behalf. The premium tier is worth it for heavy users.",
    sentiment: "positive",
    sentiment_score: 0.88,
    features_discussed: ["subscription management", "bill negotiation", "savings tracking"],
    summary: "Comprehensive review praising Rocket Money's subscription cancellation and bill negotiation features.",
    tone: "professional",
    reach_out_recommendation: "Consider reaching out for an affiliate partnership or updated feature highlight.",
    correction_needed: false,
    search_query: "Rocket Money review",
    crawl_success: true,
  },
  {
    id: 2,
    url: "https://www.reddit.com/r/personalfinance/comments/xyz789",
    domain: "reddit.com",
    title: "Is Rocket Money actually worth the premium subscription?",
    published_date: "2026-04-08",
    discovered_at: "2026-04-08T09:15:00Z",
    raw_snippet: "I've been using the free version but curious if premium is worth it. The bill negotiation sounds good but $5/month adds up...",
    relevant_excerpt: "The bill negotiation paid for itself in the first month - they got my internet bill down by $30. But the free version is solid for just tracking subscriptions.",
    sentiment: "mixed",
    sentiment_score: 0.58,
    features_discussed: ["premium pricing", "bill negotiation", "free tier"],
    summary: "Reddit discussion with mixed opinions on premium value but positive sentiment toward bill negotiation results.",
    tone: "casual",
    reach_out_recommendation: "Consider community engagement highlighting ROI of premium features.",
    correction_needed: false,
    search_query: "Rocket Money reddit",
    crawl_success: true,
  },
  {
    id: 3,
    url: "https://www.forbes.com/advisor/personal-finance/best-budget-apps",
    domain: "forbes.com",
    title: "Best Budget Apps of 2026",
    published_date: "2026-04-05",
    discovered_at: "2026-04-05T18:45:00Z",
    raw_snippet: "Rocket Money (formerly Truebill) tops our list for subscription management and bill negotiation...",
    relevant_excerpt: "Rocket Money stands out for its automatic subscription detection and proactive bill negotiation service. The app has helped users cancel over $500M in unwanted subscriptions.",
    sentiment: "positive",
    sentiment_score: 0.92,
    features_discussed: ["subscription detection", "bill negotiation", "budget tracking"],
    summary: "Featured as #1 budget app for subscription management in Forbes roundup.",
    tone: "professional",
    reach_out_recommendation: "Excellent PR placement. Request quote for future articles.",
    correction_needed: false,
    search_query: "best budget apps 2026",
    crawl_success: true,
  },
  {
    id: 4,
    url: "https://www.trustpilot.com/review/rocketmoney.com",
    domain: "trustpilot.com",
    title: "Rocket Money Reviews on Trustpilot",
    published_date: "2026-04-12",
    discovered_at: "2026-04-12T11:00:00Z",
    raw_snippet: "4.1 stars from 15,000+ reviews. Some users report issues with cancellation process...",
    relevant_excerpt: "Great app for finding subscriptions I forgot about. Saved me $200 in the first week! Only complaint is the premium upsells can feel pushy.",
    sentiment: "mixed",
    sentiment_score: 0.52,
    features_discussed: ["subscription discovery", "cancellation", "premium upsells"],
    summary: "Strong Trustpilot rating with some concerns about aggressive premium marketing.",
    tone: "balanced",
    reach_out_recommendation: "Address upsell concerns in product feedback. Consider A/B testing softer premium prompts.",
    correction_needed: false,
    search_query: "Rocket Money trustpilot",
    crawl_success: true,
  },
  {
    id: 5,
    url: "https://twitter.com/financetips/status/987654321",
    domain: "twitter.com",
    title: "@financetips tweet about Rocket Money savings",
    published_date: "2026-04-13",
    discovered_at: "2026-04-13T16:20:00Z",
    raw_snippet: "Just used Rocket Money to cancel 6 subscriptions I forgot about. That's $847/year back in my pocket!",
    relevant_excerpt: "Just used Rocket Money to cancel 6 subscriptions I forgot about. That's $847/year back in my pocket! Highly recommend.",
    sentiment: "positive",
    sentiment_score: 0.95,
    features_discussed: ["subscription cancellation", "savings"],
    summary: "Viral tweet showcasing significant savings from subscription cancellation.",
    tone: "enthusiastic",
    reach_out_recommendation: "Retweet and thank the user. Consider for testimonial.",
    correction_needed: false,
    search_query: "Rocket Money twitter",
    crawl_success: true,
  },
  {
    id: 6,
    url: "https://www.consumerreports.org/money/budgeting/rocket-money-app-review",
    domain: "consumerreports.org",
    title: "Rocket Money App Review: Privacy Concerns",
    published_date: "2026-03-28",
    discovered_at: "2026-03-28T10:30:00Z",
    raw_snippet: "While Rocket Money offers useful features, users should be aware of the financial data access required...",
    relevant_excerpt: "Rocket Money requires read-only access to your bank accounts via Plaid. While this is industry standard, some privacy-conscious users may prefer manual tracking.",
    sentiment: "neutral",
    sentiment_score: 0.45,
    features_discussed: ["data privacy", "Plaid integration", "bank access"],
    summary: "Consumer Reports review highlighting data privacy considerations.",
    tone: "cautious",
    reach_out_recommendation: "Prepare privacy FAQ or blog post addressing data security practices.",
    correction_needed: true,
    search_query: "Rocket Money privacy",
    crawl_success: true,
  },
  {
    id: 7,
    url: "https://www.youtube.com/watch?v=abc123xyz",
    domain: "youtube.com",
    title: "I Tried Rocket Money for 30 Days - Here's What Happened",
    published_date: "2026-04-01",
    discovered_at: "2026-04-01T08:00:00Z",
    raw_snippet: "This personal finance YouTuber documents their 30-day experience with Rocket Money...",
    relevant_excerpt: "After 30 days, Rocket Money found 12 subscriptions I didn't know I had and negotiated my phone bill down by $25/month. Total savings: $1,847/year.",
    sentiment: "positive",
    sentiment_score: 0.89,
    features_discussed: ["subscription discovery", "bill negotiation", "long-term savings"],
    summary: "Popular YouTube review with documented savings over 30-day trial period.",
    tone: "enthusiastic",
    reach_out_recommendation: "Reach out for potential sponsorship or affiliate partnership.",
    correction_needed: false,
    search_query: "Rocket Money YouTube review",
    crawl_success: true,
  },
  {
    id: 8,
    url: "https://www.cnet.com/personal-finance/rocket-money-vs-mint-comparison",
    domain: "cnet.com",
    title: "Rocket Money vs Mint: Which Budget App Is Better?",
    published_date: "2026-04-02",
    discovered_at: "2026-04-02T13:45:00Z",
    raw_snippet: "With Mint shutting down, many users are looking at Rocket Money as an alternative...",
    relevant_excerpt: "Rocket Money wins for subscription management and bill negotiation, while offering comparable budgeting features to the now-defunct Mint.",
    sentiment: "positive",
    sentiment_score: 0.78,
    features_discussed: ["Mint migration", "subscription management", "budgeting"],
    summary: "Favorable comparison positioning Rocket Money as top Mint alternative.",
    tone: "analytical",
    reach_out_recommendation: "Great opportunity for Mint migration marketing campaign.",
    correction_needed: false,
    search_query: "Rocket Money vs Mint",
    crawl_success: true,
  },
  {
    id: 9,
    url: "https://www.bbb.org/us/mi/detroit/profile/financial-services/rocket-money",
    domain: "bbb.org",
    title: "Rocket Money BBB Profile",
    published_date: "2026-03-20",
    discovered_at: "2026-03-20T15:30:00Z",
    raw_snippet: "BBB rating: A+. 342 complaints closed in last 3 years, mostly regarding subscription cancellation difficulties...",
    relevant_excerpt: "Rocket Money maintains an A+ BBB rating despite complaints about the cancellation process for the premium subscription.",
    sentiment: "mixed",
    sentiment_score: 0.55,
    features_discussed: ["BBB rating", "customer complaints", "cancellation process"],
    summary: "Strong BBB rating but notable complaints about premium cancellation experience.",
    tone: "formal",
    reach_out_recommendation: "Review cancellation flow UX. Consider easier premium downgrade path.",
    correction_needed: true,
    search_query: "Rocket Money BBB",
    crawl_success: true,
  },
  {
    id: 10,
    url: "https://news.ycombinator.com/item?id=456789",
    domain: "news.ycombinator.com",
    title: "Ask HN: Best apps for managing subscriptions?",
    published_date: "2026-04-11",
    discovered_at: "2026-04-11T20:00:00Z",
    raw_snippet: "Rocket Money works well but I built my own solution because I don't trust giving bank access to third parties...",
    relevant_excerpt: "Rocket Money is the most polished option but requires Plaid bank linking. For the privacy-conscious, there are self-hosted alternatives.",
    sentiment: "neutral",
    sentiment_score: 0.50,
    features_discussed: ["Plaid integration", "privacy", "alternatives"],
    summary: "HN discussion with technical users debating bank access tradeoffs.",
    tone: "technical",
    reach_out_recommendation: "Consider blog post on security architecture and data handling practices.",
    correction_needed: false,
    search_query: "subscription management apps HN",
    crawl_success: true,
  },
  {
    id: 11,
    url: "https://www.theverge.com/2026/4/9/rocket-money-new-features",
    domain: "theverge.com",
    title: "Rocket Money adds AI-powered spending insights",
    published_date: "2026-04-09",
    discovered_at: "2026-04-09T12:00:00Z",
    raw_snippet: "Rocket Money's latest update includes AI-generated spending reports and personalized savings recommendations...",
    relevant_excerpt: "The new AI features analyze spending patterns and suggest specific actions to save money, like switching to annual billing or bundling services.",
    sentiment: "positive",
    sentiment_score: 0.82,
    features_discussed: ["AI insights", "spending analysis", "personalized recommendations"],
    summary: "Tech press coverage of new AI-powered features launch.",
    tone: "informative",
    reach_out_recommendation: "Leverage for PR. Consider demo video for social media.",
    correction_needed: false,
    search_query: "Rocket Money AI features",
    crawl_success: true,
  },
  {
    id: 12,
    url: "https://www.marketwatch.com/story/rocket-money-security-breach-concerns",
    domain: "marketwatch.com",
    title: "Are Budget Apps Like Rocket Money Safe? What Experts Say",
    published_date: "2026-03-15",
    discovered_at: "2026-03-15T09:00:00Z",
    raw_snippet: "Financial experts weigh in on the safety of linking bank accounts to budget apps like Rocket Money...",
    relevant_excerpt: "While no breaches have been reported, experts recommend using unique passwords and enabling 2FA when using financial aggregation apps like Rocket Money.",
    sentiment: "neutral",
    sentiment_score: 0.48,
    features_discussed: ["security", "data safety", "2FA"],
    summary: "MarketWatch article on financial app security with neutral coverage of Rocket Money.",
    tone: "cautious",
    reach_out_recommendation: "Proactive security transparency blog post recommended. Highlight SOC 2 compliance.",
    correction_needed: true,
    search_query: "Rocket Money security",
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
