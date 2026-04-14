"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Sentiment } from "@/lib/types";

interface SentimentPieProps {
  data: Record<Sentiment, number>;
}

const COLORS: Record<Sentiment, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#eab308",
  mixed: "#06b6d4",
};

export function SentimentPie({ data }: SentimentPieProps) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as Sentiment],
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid #262626",
            borderRadius: "8px",
            color: "#fafafa",
          }}
        />
        <Legend
          formatter={(value) => <span style={{ color: "#a3a3a3" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
