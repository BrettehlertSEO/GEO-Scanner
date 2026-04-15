import Database from "better-sqlite3";
import path from "path";
import type { Mention, MentionStats, Sentiment } from "./types";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "geo_scanner.db");

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = new Database(dbPath);
  } catch {
    // Create in-memory database if file doesn't exist
    dbInstance = new Database(":memory:");
  }
  
  // Ensure table exists
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS mentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      domain TEXT NOT NULL,
      title TEXT,
      published_date TEXT,
      discovered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      raw_snippet TEXT,
      relevant_excerpt TEXT,
      sentiment TEXT DEFAULT 'neutral',
      sentiment_score REAL DEFAULT 0.0,
      features_discussed TEXT DEFAULT '[]',
      summary TEXT,
      tone TEXT,
      reach_out_recommendation TEXT,
      correction_needed INTEGER DEFAULT 0,
      search_query TEXT,
      crawl_success INTEGER DEFAULT 1
    )
  `);
  
  return dbInstance;
}

function transformMention(row: Record<string, unknown>): Mention {
  return {
    id: row.id as number,
    url: row.url as string,
    domain: row.domain as string,
    title: row.title as string,
    published_date: row.published_date as string | null,
    discovered_at: row.discovered_at as string,
    raw_snippet: row.raw_snippet as string,
    relevant_excerpt: row.relevant_excerpt as string,
    sentiment: (row.sentiment as string) as Sentiment,
    sentiment_score: row.sentiment_score as number,
    features_discussed: row.features_discussed ? JSON.parse(row.features_discussed as string) : [],
    summary: row.summary as string,
    tone: row.tone as string,
    reach_out_recommendation: row.reach_out_recommendation as string,
    correction_needed: Boolean(row.correction_needed),
    search_query: row.search_query as string,
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

export async function getMentions(options: GetMentionsOptions = {}): Promise<{ mentions: Mention[]; total: number }> {
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
  
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM mentions ${whereClause}`);
  const countResult = countStmt.get(...params) as { total: number };
  const total = countResult?.total || 0;

  const validSortColumns = ["discovered_at", "sentiment_score", "domain"];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "discovered_at";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

  const sql = `SELECT * FROM mentions ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`;
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params, limit, offset) as Record<string, unknown>[];

  return { mentions: rows.map(transformMention), total };
}

export async function getMentionById(id: number): Promise<Mention | null> {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM mentions WHERE id = ?");
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? transformMention(row) : null;
}

export async function getStats(): Promise<MentionStats> {
  const db = getDb();

  const totalStmt = db.prepare("SELECT COUNT(*) as count FROM mentions");
  const totalResult = totalStmt.get() as { count: number };
  const total = totalResult?.count || 0;

  const bySentimentStmt = db.prepare("SELECT sentiment, COUNT(*) as count FROM mentions GROUP BY sentiment");
  const bySentimentRows = bySentimentStmt.all() as { sentiment: string; count: number }[];
  const by_sentiment: Record<Sentiment, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  bySentimentRows.forEach((row) => {
    by_sentiment[row.sentiment as Sentiment] = row.count;
  });

  const correctionsStmt = db.prepare("SELECT COUNT(*) as count FROM mentions WHERE correction_needed = 1");
  const correctionsResult = correctionsStmt.get() as { count: number };
  const corrections = correctionsResult?.count || 0;

  const avgStmt = db.prepare("SELECT AVG(sentiment_score) as avg FROM mentions");
  const avgResult = avgStmt.get() as { avg: number | null };
  const avgScore = avgResult?.avg || 0;

  const topDomainsStmt = db.prepare("SELECT domain, COUNT(*) as count FROM mentions GROUP BY domain ORDER BY count DESC LIMIT 10");
  const topDomainsRows = topDomainsStmt.all() as { domain: string; count: number }[];

  const sentimentOverTimeStmt = db.prepare(`
    SELECT 
      DATE(discovered_at) as date,
      SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
      SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
      SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
      SUM(CASE WHEN sentiment = 'mixed' THEN 1 ELSE 0 END) as mixed
    FROM mentions 
    GROUP BY DATE(discovered_at) 
    ORDER BY date ASC
  `);
  const sentimentOverTimeRows = sentimentOverTimeStmt.all() as { date: string; positive: number; negative: number; neutral: number; mixed: number }[];

  const allFeaturesStmt = db.prepare("SELECT features_discussed FROM mentions WHERE features_discussed IS NOT NULL AND features_discussed != '[]'");
  const allFeaturesRows = allFeaturesStmt.all() as { features_discussed: string }[];
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

export async function getDomains(): Promise<string[]> {
  const db = getDb();
  const stmt = db.prepare("SELECT DISTINCT domain FROM mentions ORDER BY domain");
  const rows = stmt.all() as { domain: string }[];
  return rows.map((r) => r.domain);
}
