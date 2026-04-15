import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import type { Mention, MentionStats, Sentiment } from "./types";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "geo_scanner.db");

let dbInstance: Database | null = null;

async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  
  const SQL = await initSqlJs({
    // Use the CDN-hosted WASM binary for compatibility
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });
  
  // Check if database file exists
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(buffer);
  } else {
    // Create empty database with schema for demo purposes
    dbInstance = new SQL.Database();
    dbInstance.run(`
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
  }
  
  return dbInstance;
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

function queryAll(db: Database, sql: string, params: (string | number)[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(db: Database, sql: string, params: (string | number)[] = []): Record<string, unknown> | null {
  const results = queryAll(db, sql, params);
  return results.length > 0 ? results[0] : null;
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
  const db = await getDb();
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
  
  const countResult = queryOne(db, `SELECT COUNT(*) as total FROM mentions ${whereClause}`, params);
  const total = (countResult?.total as number) || 0;

  const validSortColumns = ["discovered_at", "sentiment_score", "domain"];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "discovered_at";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

  const sql = `SELECT * FROM mentions ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`;
  const rows = queryAll(db, sql, [...params, limit, offset]);

  return { mentions: rows.map(transformMention), total };
}

export async function getMentionById(id: number): Promise<Mention | null> {
  const db = await getDb();
  const row = queryOne(db, "SELECT * FROM mentions WHERE id = ?", [id]);
  return row ? transformMention(row) : null;
}

export async function getStats(): Promise<MentionStats> {
  const db = await getDb();

  const totalResult = queryOne(db, "SELECT COUNT(*) as count FROM mentions");
  const total = (totalResult?.count as number) || 0;

  const bySentimentRows = queryAll(db, "SELECT sentiment, COUNT(*) as count FROM mentions GROUP BY sentiment");
  const by_sentiment: Record<Sentiment, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  bySentimentRows.forEach((row) => {
    by_sentiment[(row.sentiment as string) as Sentiment] = row.count as number;
  });

  const correctionsResult = queryOne(db, "SELECT COUNT(*) as count FROM mentions WHERE correction_needed = 1");
  const corrections = (correctionsResult?.count as number) || 0;

  const avgResult = queryOne(db, "SELECT AVG(sentiment_score) as avg FROM mentions");
  const avgScore = (avgResult?.avg as number) || 0;

  const topDomainsRows = queryAll(db, "SELECT domain, COUNT(*) as count FROM mentions GROUP BY domain ORDER BY count DESC LIMIT 10");

  const sentimentOverTimeRows = queryAll(
    db,
    `SELECT 
      DATE(discovered_at) as date,
      SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
      SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
      SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
      SUM(CASE WHEN sentiment = 'mixed' THEN 1 ELSE 0 END) as mixed
    FROM mentions 
    GROUP BY DATE(discovered_at) 
    ORDER BY date ASC`
  );

  const allFeaturesRows = queryAll(db, "SELECT features_discussed FROM mentions WHERE features_discussed IS NOT NULL AND features_discussed != '[]'");
  const featureCounts: Record<string, number> = {};
  allFeaturesRows.forEach((row) => {
    try {
      const features = JSON.parse(row.features_discussed as string) as string[];
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
    top_domains: topDomainsRows.map(r => ({ domain: r.domain as string, count: r.count as number })),
    sentiment_over_time: sentimentOverTimeRows.map(r => ({
      date: r.date as string,
      positive: r.positive as number,
      negative: r.negative as number,
      neutral: r.neutral as number,
      mixed: r.mixed as number,
    })),
    feature_coverage,
  };
}

export async function getDomains(): Promise<string[]> {
  const db = await getDb();
  const rows = queryAll(db, "SELECT DISTINCT domain FROM mentions ORDER BY domain");
  return rows.map((r) => r.domain as string);
}
