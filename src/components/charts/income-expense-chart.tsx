"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCompactCurrency, formatCurrency } from "@/lib/finance/format";
import { incomeExpenseTrend } from "@/lib/finance/mock-data";
import { useMounted } from "@/lib/hooks/use-mounted";

type IncomeExpenseChartProps = {
  data?: typeof incomeExpenseTrend;
};

export function IncomeExpenseChart({ data = incomeExpenseTrend }: IncomeExpenseChartProps) {
  const mounted = useMounted();
  const totalIncome = data.reduce((total, item) => total + item.income, 0);
  const totalExpense = data.reduce((total, item) => total + item.expense, 0);
  const hasData = totalIncome > 0 || totalExpense > 0;

  return (
    <Card className="dashboard-chart-card min-h-[330px] overflow-hidden">
      <CardHeader className="items-start">
        <div>
          <CardTitle className="text-xl font-black tracking-tight">Cashflow Momentum</CardTitle>
          <CardDescription>Income and expenses across the current month.</CardDescription>
        </div>
        <div className="hidden gap-2 sm:flex">
          <span className="rounded-full border border-income/20 bg-income/10 px-3 py-1 text-xs font-medium text-green-300">
            Income {formatCompactCurrency(totalIncome)}
          </span>
          <span className="rounded-full border border-expense/20 bg-expense/10 px-3 py-1 text-xs font-medium text-red-300">
            Expense {formatCompactCurrency(totalExpense)}
          </span>
        </div>
      </CardHeader>
      {mounted ? (
        hasData ? (
          <div className="dashboard-chart-reveal h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeMomentum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseMomentum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="4 8" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                />
                <YAxis
                  stroke="#64748B"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
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
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22C55E"
                  strokeWidth={3.5}
                  fill="url(#incomeMomentum)"
                  dot={{ r: 3.5, fill: "#22C55E", stroke: "#052E16", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#22C55E", stroke: "#BBF7D0", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#F43F5E"
                  strokeWidth={3.5}
                  fill="url(#expenseMomentum)"
                  dot={{ r: 3.5, fill: "#F43F5E", stroke: "#4C0519", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#F43F5E", stroke: "#FFE4E6", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="dashboard-chart-reveal flex min-h-52 items-center justify-center rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/25 p-5 text-center">
            <div className="max-w-sm">
              <p className="text-base font-black text-white">No cashflow trend yet</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Add income or expenses to reveal your monthly momentum.
              </p>
              <Link
                href="/transactions"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-sky/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:-translate-y-0.5 hover:border-accent/45 hover:bg-sky/20"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add transaction
              </Link>
            </div>
          </div>
        )
      ) : (
        <LoadingSkeleton className="h-56" />
      )}
    </Card>
  );
}
