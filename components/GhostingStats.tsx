"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type GhostingStatsProps = {
  ghosted: number;
  total: number;
};

export function GhostingStats({ ghosted, total }: GhostingStatsProps) {
  const nonGhosted = Math.max(total - ghosted, 0);
  const data = [
    { label: "Ghosted", value: ghosted, color: "#f85149" },
    { label: "Responded", value: nonGhosted, color: "#3fb950" }
  ];

  return (
    <div className="h-56 rounded-xl border border-[#2d333b] bg-[#161b22] p-4">
      <p className="mb-3 text-sm font-medium text-white">Response outcome distribution</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" stroke="#8b949e" />
          <YAxis stroke="#8b949e" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#21262d" }}
            contentStyle={{ background: "#0d1117", border: "1px solid #2d333b", color: "#e6edf3" }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
