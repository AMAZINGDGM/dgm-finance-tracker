"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCompactCurrency, formatCurrency } from "@/lib/finance/format";
import { savingsGrowth } from "@/lib/finance/mock-data";
import { useMounted } from "@/lib/hooks/use-mounted";

type SavingsGrowthChartProps = {
  data?: typeof savingsGrowth;
};

export function SavingsGrowthChart({ data = savingsGrowth }: SavingsGrowthChartProps) {
  const mounted = useMounted();
  const latestSavings = data.at(-1)?.savings ?? 0;

  return (
    <Card className="dashboard-chart-card min-h-[320px] overflow-hidden">
      <CardHeader className="items-start">
        <div>
          <CardTitle>Savings Growth</CardTitle>
          <CardDescription>Running net savings through the year.</CardDescription>
        </div>
        <span className="rounded-full border border-income/20 bg-income/10 px-3 py-1 text-xs font-medium text-green-300">
          {formatCompactCurrency(latestSavings)}
        </span>
      </CardHeader>
      {mounted ? (
      <div className="dashboard-chart-reveal h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.42} />
                <stop offset="56%" stopColor="#38BDF8" stopOpacity={0.14} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#64748B" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#64748B"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(3, 7, 18, 0.94)",
                border: "1px solid rgba(56, 189, 248, 0.22)",
                borderRadius: 18,
                boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
                color: "#F8FAFC"
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#22C55E"
              strokeWidth={3}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      ) : (
        <LoadingSkeleton className="h-56" />
      )}
    </Card>
  );
}
