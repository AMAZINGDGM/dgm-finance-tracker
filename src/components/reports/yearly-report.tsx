import { CalendarDays, Goal, Landmark, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AccountBalanceChart } from "@/components/charts/account-balance-chart";
import { SavingsGrowthChart } from "@/components/charts/savings-growth-chart";
import { YearlyTrendChart } from "@/components/charts/yearly-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";
import type { YearlyReportData } from "@/lib/finance/reports";
import { cn } from "@/lib/utils";

type YearlyReportProps = {
  data: YearlyReportData;
  dashboard: DashboardData;
  generatedAt: string;
};

function YearMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "accent"
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "accent" | "green" | "red" | "blue";
}) {
  const toneClasses = {
    accent: "border-accent/30 bg-sky/10 text-accent-soft",
    green: "border-income/30 bg-income/10 text-green-300",
    red: "border-expense/30 bg-expense/10 text-red-300",
    blue: "border-sky/30 bg-sky/10 text-sky-200"
  };

  return (
    <Card className="report-metric-card print-surface relative overflow-hidden p-3.5">
      <div className={cn("mb-3 inline-flex rounded-2xl border p-2.5", toneClasses[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted">{helper}</p>
    </Card>
  );
}

export function YearlyReport({ data, dashboard, generatedAt }: YearlyReportProps) {
  return (
    <div className="print-surface space-y-3.5">
      <div className="reports-section-hero rounded-[1.35rem] border border-slate-800/75 p-4 print-surface">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
              DFT Yearly
            </p>
            <h2 className="mt-1.5 text-2xl font-black text-white">Yearly Report</h2>
            <p className="mt-1 text-sm text-muted">
              Dgm Finance Tracker - {data.year} - Generated {generatedAt}
            </p>
          </div>
          <Badge tone="accent">{formatCurrency(data.savings)} saved</Badge>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <YearMetric
          label="Yearly Income"
          value={formatCurrency(data.income)}
          helper={`${formatCurrency(data.averageMonthlyIncome)} monthly average`}
          icon={TrendingUp}
          tone="green"
        />
        <YearMetric
          label="Yearly Expense"
          value={formatCurrency(data.expense)}
          helper={`${formatCurrency(data.averageMonthlyExpense)} monthly average`}
          icon={TrendingDown}
          tone="red"
        />
        <YearMetric
          label="Yearly Savings"
          value={formatCurrency(data.savings)}
          helper={`Best month: ${data.bestSavingMonth}`}
          icon={PiggyBank}
          tone="blue"
        />
        <YearMetric
          label="Highest Spend"
          value={data.highestSpendingMonth}
          helper="Highest monthly expense"
          icon={CalendarDays}
        />
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <YearlyTrendChart data={dashboard.yearlyTrend} />
        <SavingsGrowthChart data={dashboard.savingsGrowth} />
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <AccountBalanceChart data={dashboard.accountBalances} />
        <Card className="reports-insight-card print-surface p-4">
          <CardHeader>
            <CardTitle>Goals Progress</CardTitle>
            <Goal className="h-5 w-5 text-accent-soft" aria-hidden="true" />
          </CardHeader>
          {data.goals.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/30 p-4 text-sm text-muted">
              No active goals yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data.goals.map((goal) => {
                const progress =
                  goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;

                return (
                  <div key={goal.name}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{goal.name}</p>
                      <p className="text-xs text-muted">{Math.round(progress)}%</p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${progress}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {formatCurrency(goal.current)} of {formatCurrency(goal.target)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <Card className="reports-insight-card print-surface p-4">
        <CardHeader>
          <CardTitle>Yearly Snapshot</CardTitle>
          <Landmark className="h-5 w-5 text-accent-soft" aria-hidden="true" />
        </CardHeader>
        <div className="grid gap-4 text-sm text-muted sm:grid-cols-3">
          <p>
            Total balance:{" "}
            <span className="font-semibold text-white">
              {formatCurrency(dashboard.summary.totalBalance)}
            </span>
          </p>
          <p>
            Best saving month:{" "}
            <span className="font-semibold text-white">{data.bestSavingMonth}</span>
          </p>
          <p>
            Highest spending month:{" "}
            <span className="font-semibold text-white">{data.highestSpendingMonth}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
