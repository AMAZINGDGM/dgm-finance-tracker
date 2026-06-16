"use client";

import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCurrency } from "@/lib/finance/format";
import { expenseCategories } from "@/lib/finance/mock-data";
import { useMounted } from "@/lib/hooks/use-mounted";

type ExpenseCategoryChartProps = {
  data?: typeof expenseCategories;
};

export function ExpenseCategoryChart({ data = expenseCategories }: ExpenseCategoryChartProps) {
  const mounted = useMounted();
  const hasRealData = data.some((item) => item.name !== "No expenses" && item.value > 0);
  const total = hasRealData ? data.reduce((amount, item) => amount + item.value, 0) : 0;
  const categoryRows = hasRealData
    ? data
        .filter((item) => item.value > 0)
        .sort((first, second) => second.value - first.value)
        .map((item) => ({
          ...item,
          percentage: total > 0 ? (item.value / total) * 100 : 0
        }))
    : [];
  const topCategory = categoryRows[0];

  return (
    <Card className="dashboard-chart-card self-start overflow-hidden p-4">
      <CardHeader className="mb-3 items-start gap-3 p-0">
        <div>
          <CardTitle className="text-lg font-black tracking-tight">Category Distribution</CardTitle>
          <CardDescription>Where your monthly spending is concentrated.</CardDescription>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950/55 px-3 py-1 text-xs font-medium text-slate-300">
          {hasRealData ? formatCurrency(total) : "Ready for insights"}
        </span>
      </CardHeader>
      {mounted ? (
        hasRealData ? (
          <div className="dashboard-chart-reveal space-y-3">
            <div className="rounded-[1.35rem] border border-cyan-400/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_58%),rgba(2,6,23,0.36)] p-3">
              <div className="relative mx-auto h-44 w-full max-w-[220px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryRows}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="86%"
                      paddingAngle={3}
                      stroke="rgba(3,7,18,0.78)"
                      strokeWidth={3}
                    >
                      {categoryRows.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
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
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Expenses
                    </p>
                    <p className="mt-0.5 text-base font-black text-white">{formatCurrency(total)}</p>
                    <p className="text-[11px] text-cyan-200/80">{categoryRows.length} labels</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {categoryRows.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-800/70 bg-slate-950/36 px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <span className="flex min-w-0 items-start gap-2 text-slate-200">
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
                        style={{ backgroundColor: item.color, color: item.color }}
                      />
                      <span className="min-w-0 break-words text-sm font-semibold leading-5">
                        {item.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs font-bold text-white">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-950/85 ring-1 ring-slate-800/70">
                    <div
                      className="h-full rounded-full shadow-[0_0_14px_currentColor]"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color, color: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {topCategory ? (
              <div className="rounded-2xl border border-indigo-300/20 bg-indigo-400/5 px-3 py-2 text-xs leading-5 text-slate-300">
                Spending is concentrated across {categoryRows.length}{" "}
                {categoryRows.length === 1 ? "category" : "categories"}, led by{" "}
                <span className="font-bold text-cyan-100">{topCategory.name}</span>.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="dashboard-chart-reveal flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/25 p-4 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-sky/10 text-accent-soft">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 text-base font-black text-white">No category pattern yet</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Add expenses to reveal your spending distribution.
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
        <LoadingSkeleton className="h-40" />
      )}
    </Card>
  );
}
