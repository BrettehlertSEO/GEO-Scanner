import { NextRequest, NextResponse } from "next/server";
import { getMentions, getDomains, type GetMentionsOptions } from "@/lib/db";
import type { Sentiment } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const options: GetMentionsOptions = {};

    const sentiment = searchParams.get("sentiment");
    if (sentiment && ["positive", "negative", "neutral", "mixed"].includes(sentiment)) {
      options.sentiment = sentiment as Sentiment;
    }

    const domain = searchParams.get("domain");
    if (domain) {
      options.domain = domain;
    }

    const correctionNeeded = searchParams.get("correction_needed");
    if (correctionNeeded === "true") {
      options.correction_needed = true;
    } else if (correctionNeeded === "false") {
      options.correction_needed = false;
    }

    const search = searchParams.get("search");
    if (search) {
      options.search = search;
    }

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    options.limit = Math.min(Math.max(limit, 1), 100);

    const offset = parseInt(searchParams.get("offset") || "0", 10);
    options.offset = Math.max(offset, 0);

    const sortBy = searchParams.get("sort_by");
    if (sortBy && ["discovered_at", "sentiment_score", "domain"].includes(sortBy)) {
      options.sort_by = sortBy as GetMentionsOptions["sort_by"];
    }

    const sortOrder = searchParams.get("sort_order");
    if (sortOrder && ["asc", "desc"].includes(sortOrder)) {
      options.sort_order = sortOrder as "asc" | "desc";
    }

    const { mentions, total } = getMentions(options);
    const domains = getDomains();

    return NextResponse.json({
      mentions,
      total,
      limit: options.limit,
      offset: options.offset,
      domains,
    });
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return NextResponse.json({ error: "Failed to fetch mentions" }, { status: 500 });
  }
}
