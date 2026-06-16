import { ArrowDownLeft, ArrowUpRight, Gauge, PiggyBank, Sparkles } from "lucide-react";

import { BudgetRadialChart } from "@/components/charts/budget-radial-chart";
import { DailySpendingChart } from "@/components/charts/daily-spending-chart";
import { ExpenseCategoryChart } from "@/components/charts/expense-category-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";
import type { MonthlyReportData } from "@/lib/finance/reports";
import { cn } from "@/lib/utils";

type MonthlyReportProps = {
  data: MonthlyReportData;
  dashboard: DashboardData;
  generatedAt: string;
};

function MetricCard({
  label,
  value,
  helper,
  tone = "accent"
}: {
  label: string;
  value: string;
  helper: string;
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
      <div
        className={cn(
          "mb-3 inline-flex rounded-2xl border p-2.5",
          toneClasses[tone]
        )}
      >
        {tone === "green" ? (
          <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
        ) : tone === "red" ? (
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        ) : tone === "blue" ? (
          <PiggyBank className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Gauge className="h-5 w-5" aria-hidden="true" />
        )}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted">{helper}</p>
    </Card>
  );
}

export function MonthlyReport({ data, dashboard, generatedAt }: MonthlyReportProps) {
  return (
    <div className="print-surface space-y-3.5">
      <div className="reports-section-hero rounded-[1.35rem] border border-slate-800/75 p-4 print-surface">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
              DFT Monthly
            </p>
            <h2 className="mt-1.5 text-2xl font-black text-white">Monthly Report</h2>
            <p className="mt-1 text-sm text-muted">
              Dgm Finance Tracker - {data.label} - Generated {generatedAt}
            </p>
          </div>
          <Badge tone="accent">{data.savingsRate}% savings rate</Badge>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Income"
          value={formatCurrency(data.income)}
          helper="Income recorded this month"
          tone="green"
        />
        <MetricCard
          label="Total Expense"
          value={formatCurrency(data.expense)}
          helper="Expenses excluding transfers"
          tone="red"
        />
        <MetricCard
          label="Net Savings"
          value={formatCurrency(data.netSavings)}
          helper="Income minus expenses"
          tone="blue"
        />
        <MetricCard
          label="Budget Usage"
          value={`${data.budgetUsage}%`}
          helper={`${formatCurrency(data.budgetUsedAmount)} of ${formatCurrency(data.budgetLimit)}`}
        />
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <IncomeExpenseChart data={dashboard.incomeExpenseTrend} />
        <ExpenseCategoryChart data={dashboard.expenseCategories} />
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <DailySpendingChart data={dashboard.dailySpending} />
        <BudgetRadialChart value={data.budgetUsage} title="Monthly Budget Usage" />
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <Card className="reports-table-card print-surface p-4">
          <CardHeader>
            <CardTitle>Top 10 Transactions</CardTitle>
            <Badge tone="slate">{data.topTransactions.length}</Badge>
          </CardHeader>
          {data.topTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/30 p-6 text-sm text-muted">
              No transactions recorded for this month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr className="border-b border-slate-800">
                    <th className="py-3 pr-4 font-semibold">Date</th>
                    <th className="py-3 pr-4 font-semibold">Transaction</th>
                    <th className="py-3 pr-4 font-semibold">Category</th>
                    <th className="py-3 pr-4 font-semibold">Account</th>
                    <th className="py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-800/70">
                      <td className="py-3 pr-4 text-muted">{transaction.date}</td>
                      <td className="py-3 pr-4 font-medium text-white">{transaction.title}</td>
                      <td className="py-3 pr-4 text-muted">{transaction.category}</td>
                      <td className="py-3 pr-4 text-muted">{transaction.account}</td>
                      <td
                        className={cn(
                          "py-3 text-right font-bold",
                          transaction.type === "income"
                            ? "text-green-300"
                            : transaction.type === "transfer"
                              ? "text-sky-200"
                              : "text-red-300"
                        )}
                      >
                        {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="reports-insight-card print-surface p-4">
          <CardHeader>
            <CardTitle>Monthly Insight</CardTitle>
            <Sparkles className="h-5 w-5 text-accent-soft" aria-hidden="true" />
          </CardHeader>
          <div className="space-y-3 text-sm text-muted">
            <p>
              Biggest spending category:{" "}
              <span className="font-semibold text-white">{data.biggestExpenseCategory}</span>
            </p>
            <p>
              Net savings:{" "}
              <span className="font-semibold text-white">{formatCurrency(data.netSavings)}</span>
            </p>
            <p>
              Budget status:{" "}
              <span className="font-semibold text-white">{data.budgetUsage}% used</span>
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
