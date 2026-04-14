"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FeaturesBarProps {
  data: { feature: string; count: number }[];
}

export function FeaturesBar({ data }: FeaturesBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
        <XAxis type="number" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="feature"
          stroke="#a3a3a3"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={140}
          tickFormatter={(value) => (value.length > 20 ? `${value.slice(0, 20)}...` : value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid #262626",
            borderRadius: "8px",
            color: "#fafafa",
          }}
        />
        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
