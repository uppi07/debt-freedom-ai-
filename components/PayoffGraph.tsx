"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

type GraphPoint = {
  month: number;
  remaining: number;
};

export default function PayoffGraph({
  planned,
  actual,
}: {
  planned: GraphPoint[];
  actual: GraphPoint[];
}) {
  // Format data for Recharts
  const merged = planned.map((p, i) => ({
    month: p.month,
    planned: p.remaining,
    actual: actual[i]?.remaining ?? null, // show only if exists
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h2 className="text-xl font-semibold mb-4">Debt Payoff Progress</h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" label={{ value: "Month", position: "insideBottomRight", offset: -5 }} />
          <YAxis label={{ value: "Remaining", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />

          {/* Planned Curve */}
          <Line
            type="monotone"
            dataKey="planned"
            stroke="#2563eb"
            strokeWidth={3}
            name="Planned Payoff"
            dot={false}
          />

          {/* Actual Curve */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#10b981"
            strokeWidth={3}
            name="Your Actual Progress"
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
