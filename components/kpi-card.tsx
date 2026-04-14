import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-sm font-medium", trend.isPositive ? "text-positive" : "text-negative")}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
