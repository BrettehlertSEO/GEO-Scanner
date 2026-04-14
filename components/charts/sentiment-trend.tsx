"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SentimentTrendProps {
  data: { date: string; positive: number; negative: number; neutral: number; mixed: number }[];
}

export function SentimentTrend({ data }: SentimentTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="date" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid #262626",
            borderRadius: "8px",
            color: "#fafafa",
          }}
        />
        <Legend formatter={(value) => <span style={{ color: "#a3a3a3" }}>{value}</span>} />
        <Area type="monotone" dataKey="positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
        <Area type="monotone" dataKey="neutral" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
        <Area type="monotone" dataKey="mixed" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
        <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
