import Database from "better-sqlite3";
import path from "path";
import type { Mention, MentionStats, Sentiment } from "./types";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "geo_scanner.db");

function getDb() {
  return new Database(dbPath, { readonly: true });
}

interface RawMention {
  id: number;
  url: string;
  domain: string;
  title: string;
  published_date: string | null;
  discovered_at: string;
  raw_snippet: string;
  relevant_excerpt: string;
  sentiment: string;
  sentiment_score: number;
  features_discussed: string;
  summary: string;
  tone: string;
  reach_out_recommendation: string;
  correction_needed: number;
  search_query: string;
  crawl_success: number;
}

function transformMention(row: RawMention): Mention {
  return {
    ...row,
    sentiment: row.sentiment as Sentiment,
    features_discussed: row.features_discussed ? JSON.parse(row.features_discussed) : [],
    correction_needed: Boolean(row.correction_needed),
    crawl_success: Boolean(row.crawl_success),
  };
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

export function getMentions(options: GetMentionsOptions = {}): { mentions: Mention[]; total: number } {
  const db = getDb();
  const { sentiment, domain, correction_needed, search, limit = 50, offset = 0, sort_by = "discovered_at", sort_order = "desc" } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (sentiment) {
    conditions.push("sentiment = ?");
    params.push(sentiment);
  }
  if (domain) {
    conditions.push("domain = ?");
    params.push(domain);
  }
  if (correction_needed !== undefined) {
    conditions.push("correction_needed = ?");
    params.push(correction_needed ? 1 : 0);
  }
  if (search) {
    conditions.push("(title LIKE ? OR domain LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  
  const countSql = `SELECT COUNT(*) as total FROM mentions ${whereClause}`;
  const total = (db.prepare(countSql).get(...params) as { total: number }).total;

  const validSortColumns = ["discovered_at", "sentiment_score", "domain"];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "discovered_at";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

  const sql = `SELECT * FROM mentions ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, limit, offset) as RawMention[];

  db.close();
  return { mentions: rows.map(transformMention), total };
}

export function getMentionById(id: number): Mention | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM mentions WHERE id = ?").get(id) as RawMention | undefined;
  db.close();
  return row ? transformMention(row) : null;
}

export function getStats(): MentionStats {
  const db = getDb();

  const total = (db.prepare("SELECT COUNT(*) as count FROM mentions").get() as { count: number }).count;

  const bySentimentRows = db.prepare("SELECT sentiment, COUNT(*) as count FROM mentions GROUP BY sentiment").all() as { sentiment: string; count: number }[];
  const by_sentiment: Record<Sentiment, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  bySentimentRows.forEach((row) => {
    by_sentiment[row.sentiment as Sentiment] = row.count;
  });

  const corrections = (db.prepare("SELECT COUNT(*) as count FROM mentions WHERE correction_needed = 1").get() as { count: number }).count;

  const avgScore = (db.prepare("SELECT AVG(sentiment_score) as avg FROM mentions").get() as { avg: number | null }).avg || 0;

  const topDomainsRows = db.prepare("SELECT domain, COUNT(*) as count FROM mentions GROUP BY domain ORDER BY count DESC LIMIT 10").all() as { domain: string; count: number }[];

  const sentimentOverTimeRows = db
    .prepare(
      `SELECT 
        DATE(discovered_at) as date,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'mixed' THEN 1 ELSE 0 END) as mixed
      FROM mentions 
      GROUP BY DATE(discovered_at) 
      ORDER BY date ASC`
    )
    .all() as { date: string; positive: number; negative: number; neutral: number; mixed: number }[];

  const allFeaturesRows = db.prepare("SELECT features_discussed FROM mentions WHERE features_discussed IS NOT NULL AND features_discussed != '[]'").all() as { features_discussed: string }[];
  const featureCounts: Record<string, number> = {};
  allFeaturesRows.forEach((row) => {
    try {
      const features = JSON.parse(row.features_discussed) as string[];
      features.forEach((f) => {
        featureCounts[f] = (featureCounts[f] || 0) + 1;
      });
    } catch {
      // Skip invalid JSON
    }
  });
  const feature_coverage = Object.entries(featureCounts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  db.close();

  return {
    total_mentions: total,
    by_sentiment,
    corrections_needed: corrections,
    avg_sentiment_score: avgScore,
    top_domains: topDomainsRows,
    sentiment_over_time: sentimentOverTimeRows,
    feature_coverage,
  };
}

export function getDomains(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT DISTINCT domain FROM mentions ORDER BY domain").all() as { domain: string }[];
  db.close();
  return rows.map((r) => r.domain);
}
