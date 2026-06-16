"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCompactCurrency, formatCurrency } from "@/lib/finance/format";
import { dailySpending } from "@/lib/finance/mock-data";
import { useMounted } from "@/lib/hooks/use-mounted";

type DailySpendingChartProps = {
  data?: typeof dailySpending;
};

export function DailySpendingChart({ data = dailySpending }: DailySpendingChartProps) {
  const mounted = useMounted();
  const hasData = data.some((item) => item.amount > 0);
  const totalSpending = data.reduce((total, item) => total + item.amount, 0);
  const maxAmount = Math.max(...data.map((item) => item.amount), 1);

  return (
    <Card className="dashboard-chart-card min-h-[270px] overflow-hidden p-3.5">
      <CardHeader className="mb-2.5 items-start">
        <div>
          <CardTitle className="text-xl font-black tracking-tight">Daily Spending</CardTitle>
          <CardDescription>Expense intensity by day this month.</CardDescription>
        </div>
        <span className="rounded-full border border-cyan-300/16 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-cyan-100">
          {hasData ? formatCurrency(totalSpending) : "Ready for activity"}
        </span>
      </CardHeader>
      {mounted ? (
        hasData ? (
          <div className="dashboard-chart-reveal h-44 min-w-0 rounded-[1.25rem] border border-cyan-400/10 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_42%),rgba(2,6,23,0.22)] px-1.5 pt-2.5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 10, bottom: 6, left: 0 }}>
                <defs>
                  <linearGradient id="dailySpendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.98} />
                    <stop offset="52%" stopColor="#38BDF8" stopOpacity={0.88} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.72} />
                  </linearGradient>
                  <linearGradient id="dailySpendHotGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.96} />
                    <stop offset="58%" stopColor="#38BDF8" stopOpacity={0.82} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.72} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.10)" strokeDasharray="3 9" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#64748B"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatCompactCurrency}
                />
                <Tooltip
                  cursor={{ fill: "rgba(56,189,248,0.065)", radius: 12 }}
                  contentStyle={{
                    background: "rgba(3, 7, 18, 0.94)",
                    border: "1px solid rgba(56, 189, 248, 0.22)",
                    borderRadius: 18,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
                    color: "#F8FAFC"
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar
                  dataKey="amount"
                  fill="url(#dailySpendGradient)"
                  background={{ fill: "rgba(15,23,42,0.34)", radius: 10 }}
                  radius={[11, 11, 6, 6]}
                  maxBarSize={34}
                >
                  {data.map((item) => {
                    const hotDay = item.amount >= maxAmount * 0.78;

                    return (
                      <Cell
                        key={item.day}
                        fill={hotDay ? "url(#dailySpendHotGradient)" : "url(#dailySpendGradient)"}
                        opacity={item.amount > 0 ? 1 : 0.28}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="dashboard-chart-reveal flex min-h-44 items-center justify-center rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/25 p-5 text-center">
            <div className="max-w-sm">
              <p className="text-base font-black text-white">No daily spending yet</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Add your first expense to see how spending moves through the month.
              </p>
              <Link
                href="/transactions"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-sky/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:-translate-y-0.5 hover:border-accent/45 hover:bg-sky/20"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add expense
              </Link>
            </div>
          </div>
        )
      ) : (
        <LoadingSkeleton className="h-44" />
      )}
    </Card>
  );
}
