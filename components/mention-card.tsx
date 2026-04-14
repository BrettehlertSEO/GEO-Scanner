import Link from "next/link";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { SentimentBadge } from "./sentiment-badge";
import { formatDate } from "@/lib/utils";
import type { Mention } from "@/lib/types";

interface MentionCardProps {
  mention: Mention;
}

export function MentionCard({ mention }: MentionCardProps) {
  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/mentions/${mention.id}`} className="text-sm font-medium text-foreground hover:underline line-clamp-1">
              {mention.title || "Untitled"}
            </Link>
            {mention.correction_needed && (
              <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Correction
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{mention.domain}</span>
            <span>·</span>
            <span>{formatDate(mention.discovered_at)}</span>
          </div>
          {mention.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{mention.summary}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SentimentBadge sentiment={mention.sentiment} />
          <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
