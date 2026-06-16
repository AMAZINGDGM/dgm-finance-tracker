"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCompactCurrency, formatCurrency } from "@/lib/finance/format";
import { useMounted } from "@/lib/hooks/use-mounted";

const yearlyData = [
  { month: "Jan", income: 6800000, expense: 3900000 },
  { month: "Feb", income: 7100000, expense: 4200000 },
  { month: "Mar", income: 6500000, expense: 3600000 },
  { month: "Apr", income: 7400000, expense: 4100000 },
  { month: "May", income: 7200000, expense: 3850000 }
];

type YearlyTrendChartProps = {
  data?: typeof yearlyData;
  title?: string;
};

export function YearlyTrendChart({
  data = yearlyData,
  title = "Yearly Financial Trend"
}: YearlyTrendChartProps) {
  const mounted = useMounted();

  return (
    <Card className="dashboard-chart-card flex min-h-[300px] flex-col overflow-hidden p-4">
      <CardHeader className="mb-2.5 items-start">
        <div>
          <CardTitle className="text-lg font-black tracking-tight">{title}</CardTitle>
          <CardDescription>Month-by-month income and expense movement.</CardDescription>
        </div>
      </CardHeader>
      {mounted ? (
        <div className="dashboard-chart-reveal min-h-56 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="4 8" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748B"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <Tooltip
                cursor={{ stroke: "rgba(56,189,248,0.28)", strokeWidth: 1 }}
                contentStyle={{
                  background: "rgba(3, 7, 18, 0.94)",
                  border: "1px solid rgba(56, 189, 248, 0.22)",
                  borderRadius: 18,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
                  color: "#F8FAFC"
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22C55E"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#22C55E", stroke: "#BBF7D0", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#F43F5E"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#F43F5E", stroke: "#FFE4E6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <LoadingSkeleton className="h-56" />
      )}
    </Card>
  );
}
