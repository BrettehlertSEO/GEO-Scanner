"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { MentionCard } from "@/components/mention-card";
import { cn } from "@/lib/utils";
import type { Mention, Sentiment } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const sentimentOptions: { value: Sentiment | ""; label: string }[] = [
  { value: "", label: "All Sentiments" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
  { value: "mixed", label: "Mixed" },
];

export default function MentionsPage() {
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | "">("");
  const [domain, setDomain] = useState("");
  const [correctionNeeded, setCorrectionNeeded] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sentiment) params.set("sentiment", sentiment);
  if (domain) params.set("domain", domain);
  if (correctionNeeded) params.set("correction_needed", correctionNeeded);
  params.set("limit", limit.toString());
  params.set("offset", (page * limit).toString());

  const { data, isLoading, error } = useSWR<{ mentions: Mention[]; total: number; domains: string[] }>(
    `/api/mentions?${params.toString()}`,
    fetcher
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mentions</h1>
        <p className="text-muted-foreground">Browse and filter all discovered brand mentions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or domain..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-border bg-muted px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sentiment}
            onChange={(e) => {
              setSentiment(e.target.value as Sentiment | "");
              setPage(0);
            }}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {sentimentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Domains</option>
            {data?.domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={correctionNeeded}
            onChange={(e) => {
              setCorrectionNeeded(e.target.value as "" | "true" | "false");
              setPage(0);
            }}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Mentions</option>
            <option value="true">Needs Correction</option>
            <option value="false">No Correction</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {data && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing {data.mentions.length} of {data.total} mentions
        </p>
      )}

      {/* Mentions List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          Failed to load mentions. Please try again.
        </div>
      ) : data?.mentions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No mentions found matching your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {data?.mentions.map((mention) => (
            <MentionCard key={mention.id} mention={mention} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={cn(
              "flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
              page === 0 ? "cursor-not-allowed opacity-50" : "hover:bg-muted"
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={cn(
              "flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
              page >= totalPages - 1 ? "cursor-not-allowed opacity-50" : "hover:bg-muted"
            )}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
