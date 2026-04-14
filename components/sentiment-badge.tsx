import { cn } from "@/lib/utils";
import type { Sentiment } from "@/lib/types";

interface SentimentBadgeProps {
  sentiment: Sentiment;
  showLabel?: boolean;
  className?: string;
}

const sentimentConfig: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: "Positive", className: "bg-positive/15 text-positive border-positive/30" },
  negative: { label: "Negative", className: "bg-negative/15 text-negative border-negative/30" },
  neutral: { label: "Neutral", className: "bg-neutral/15 text-neutral border-neutral/30" },
  mixed: { label: "Mixed", className: "bg-mixed/15 text-mixed border-mixed/30" },
};

export function SentimentBadge({ sentiment, showLabel = true, className }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", config.className, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", sentiment === "positive" && "bg-positive", sentiment === "negative" && "bg-negative", sentiment === "neutral" && "bg-neutral", sentiment === "mixed" && "bg-mixed")} />
      {showLabel && config.label}
    </span>
  );
}
