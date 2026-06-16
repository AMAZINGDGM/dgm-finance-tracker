"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  LineChart,
  Printer,
  Sparkles,
  TrendingUp,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AccountBalanceChart } from "@/components/charts/account-balance-chart";
import { ExpenseCategoryChart } from "@/components/charts/expense-category-chart";
import { YearlyTrendChart } from "@/components/charts/yearly-trend-chart";
import { MonthlyReport } from "@/components/reports/monthly-report";
import { YearlyReport } from "@/components/reports/yearly-report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";
import type { ReportsData } from "@/lib/finance/reports";
import { cn } from "@/lib/utils";

type ReportsDashboardProps = {
  dashboard: DashboardData;
  reports: ReportsData;
};

type ReportTab = "overview" | "monthly" | "yearly" | "export";

const tabs: { id: ReportTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "monthly", label: "Monthly", icon: FileText },
  { id: "yearly", label: "Yearly", icon: LineChart },
  { id: "export", label: "Export", icon: Download }
];

const activeTabClass =
  "border border-indigo-300/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92),rgba(49,46,129,0.34))] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_18px_rgba(99,102,241,0.12)]";

const quietActionClass =
  "border-indigo-300/20 bg-slate-950/75 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-cyan-300/30 hover:bg-slate-900/80 hover:text-white hover:shadow-[0_0_18px_rgba(99,102,241,0.12)]";

function ReportMetric({
  helper,
  icon: Icon,
  label,
  tone = "accent",
  value
}: {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone?: "accent" | "green" | "red" | "blue";
  value: string;
}) {
  const toneClasses = {
    accent: "border-accent/24 bg-sky/10 text-accent-soft",
    green: "border-income/24 bg-income/10 text-green-300",
    red: "border-expense/24 bg-expense/10 text-red-300",
    blue: "border-sky/24 bg-sky/10 text-sky-200"
  };

  return (
    <Card className="report-metric-card print-surface relative h-full min-h-[116px] overflow-hidden p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-lg font-black leading-tight tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{helper}</p>
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl border", toneClasses[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}

function InsightPanel({ reports }: { reports: ReportsData }) {
  const direction =
    reports.monthly.netSavings >= 0
      ? "Positive monthly direction"
      : "Monthly cashflow needs attention";

  const insights = [
    {
      label: "Current period",
      value: reports.monthly.label,
      helper: `Generated ${reports.generatedAt}`
    },
    {
      label: "Top expense category",
      value: reports.monthly.biggestExpenseCategory,
      helper: "Highest category concentration this month"
    },
    {
      label: "Best saving month",
      value: reports.yearly.bestSavingMonth,
      helper: "Strongest month in the yearly view"
    },
    {
      label: "Highest spending period",
      value: reports.yearly.highestSpendingMonth,
      helper: "Peak expense month"
    }
  ];

  return (
    <Card className="reports-insight-card print-surface relative h-full overflow-hidden p-3.5">
      <CardHeader className="mb-2.5 items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
            Report Insight
          </p>
          <CardTitle className="mt-1.5 text-lg font-black tracking-tight">
            Executive Snapshot
          </CardTitle>
          <CardDescription>{direction}</CardDescription>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-sky/10 text-accent-soft">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <div className="grid gap-2">
        {insights.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-800/72 bg-slate-950/30 p-2"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 font-bold text-white">{item.value}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{item.helper}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CategoryInsightCard({
  categories,
  reports
}: {
  categories: DashboardData["expenseCategories"];
  reports: ReportsData;
}) {
  const categoryRows = categories
    .filter((item) => item.name !== "No expenses" && item.value > 0)
    .sort((first, second) => second.value - first.value);
  const totalExpense = categoryRows.reduce((amount, item) => amount + item.value, 0);
  const topCategory = categoryRows[0];
  const topShare = topCategory && totalExpense > 0 ? (topCategory.value / totalExpense) * 100 : 0;

  return (
    <Card className="reports-insight-card print-surface relative overflow-hidden p-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">
            Spending Intelligence
          </p>
          <p className="mt-1 text-base font-black text-white">Category Insight</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/72 bg-slate-950/30 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Top category
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">
            {topCategory ? topCategory.name : "No data"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/72 bg-slate-950/30 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Concentration
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {categoryRows.length} {categoryRows.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/72 bg-slate-950/30 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Monthly expense
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {formatCurrency(totalExpense || reports.monthly.expense)}
          </p>
        </div>
      </div>

      <div className="mt-2 rounded-2xl border border-indigo-300/20 bg-slate-950/32 px-3 py-2 text-xs leading-5 text-slate-300">
        {topCategory ? (
          <>
            <span className="font-bold text-cyan-100">{topCategory.name}</span> leads this month
            with {formatCurrency(topCategory.value)} ({topShare.toFixed(1)}% of category spend).
          </>
        ) : (
          "Add expenses to activate category intelligence for this report."
        )}
      </div>
    </Card>
  );
}

function OverviewPanel({ dashboard, reports }: ReportsDashboardProps) {
  return (
    <div className="space-y-3.5">
      <section className="grid auto-rows-fr gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetric
          label="Total Balance"
          value={formatCurrency(reports.overview.totalBalance)}
          helper="Net across all accounts"
          icon={WalletCards}
          tone="accent"
        />
        <ReportMetric
          label="Monthly Income"
          value={formatCurrency(reports.monthly.income)}
          helper={reports.monthly.label}
          icon={ArrowDownLeft}
          tone="green"
        />
        <ReportMetric
          label="Monthly Expense"
          value={formatCurrency(reports.monthly.expense)}
          helper={`Top: ${reports.monthly.biggestExpenseCategory}`}
          icon={ArrowUpRight}
          tone="red"
        />
        <ReportMetric
          label="Yearly Savings"
          value={formatCurrency(reports.yearly.savings)}
          helper={`${reports.yearly.year} performance`}
          icon={TrendingUp}
          tone="blue"
        />
      </section>

      <section className="grid items-stretch gap-3 xl:grid-cols-[minmax(0,1.35fr)_372px]">
        <div className="reports-chart-feature h-full">
          <YearlyTrendChart data={dashboard.yearlyTrend} title="Executive Financial Trend" />
        </div>
        <InsightPanel reports={reports} />
      </section>

      <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <div className="grid gap-3 self-start">
          <ExpenseCategoryChart data={dashboard.expenseCategories} />
          <CategoryInsightCard categories={dashboard.expenseCategories} reports={reports} />
        </div>
        <div className="self-start">
          <AccountBalanceChart data={dashboard.accountBalances} />
        </div>
      </section>
    </div>
  );
}

function ExportPanel({ reports }: { reports: ReportsData }) {
  function downloadPdf(kind: "monthly" | "yearly") {
    window.location.assign(`/api/reports/${kind}-pdf`);
  }

  return (
    <Card className="reports-export-card print-surface relative overflow-hidden">
      <CardHeader className="items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
            Export Center
          </p>
          <CardTitle className="mt-2 text-2xl font-black tracking-tight">
            DFT Report Package
          </CardTitle>
          <CardDescription>
            Dgm Finance Tracker - generated {reports.generatedAt}
          </CardDescription>
        </div>
        <Badge tone="accent">Print Ready</Badge>
      </CardHeader>
      <div className="print-hidden grid gap-3 lg:grid-cols-3">
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => downloadPdf("monthly")}
          className="group rounded-[1.35rem] border border-accent/18 bg-slate-950/34 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/36 hover:bg-slate-900/50"
        >
          <Download className="h-5 w-5 text-accent-soft" aria-hidden="true" />
          <p className="mt-3 font-bold text-white">Generate Monthly PDF</p>
          <p className="mt-1 text-xs leading-5 text-muted">{reports.monthly.label}</p>
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => downloadPdf("yearly")}
          className="group rounded-[1.35rem] border border-slate-800/78 bg-slate-950/34 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/36 hover:bg-slate-900/50"
        >
          <FileText className="h-5 w-5 text-accent-soft" aria-hidden="true" />
          <p className="mt-3 font-bold text-white">Generate Yearly PDF</p>
          <p className="mt-1 text-xs leading-5 text-muted">{reports.yearly.year}</p>
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => window.print()}
          className="group rounded-[1.35rem] border border-slate-800/78 bg-slate-950/34 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/36 hover:bg-slate-900/50"
        >
          <Printer className="h-5 w-5 text-accent-soft" aria-hidden="true" />
          <p className="mt-3 font-bold text-white">Print Report</p>
          <p className="mt-1 text-xs leading-5 text-muted">Browser print layout</p>
        </button>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/75 bg-slate-950/26 p-3">
          Monthly net:{" "}
          <span className="font-semibold text-white">{formatCurrency(reports.monthly.netSavings)}</span>
        </div>
        <div className="rounded-2xl border border-slate-800/75 bg-slate-950/26 p-3">
          Yearly savings:{" "}
          <span className="font-semibold text-white">{formatCurrency(reports.yearly.savings)}</span>
        </div>
        <div className="rounded-2xl border border-slate-800/75 bg-slate-950/26 p-3">
          Budget usage: <span className="font-semibold text-white">{reports.monthly.budgetUsage}%</span>
        </div>
      </div>
    </Card>
  );
}

export function ReportsDashboard({ dashboard, reports }: ReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const activePdfKind = activeTab === "yearly" ? "yearly" : "monthly";

  function downloadPdf(kind: "monthly" | "yearly" = activePdfKind) {
    window.location.assign(`/api/reports/${kind}-pdf`);
  }

  return (
    <div className="space-y-3.5">
      <div className="reports-control-panel print-hidden rounded-[1.25rem] border border-slate-800/75 p-2">
        <div className="grid gap-2 2xl:grid-cols-[minmax(0,1fr)_minmax(440px,auto)] 2xl:items-center">
          <div className="min-w-0">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Report Workspace
            </p>
            <div className="flex overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/55 p-1 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "inline-flex min-w-max items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                      active
                        ? activeTabClass
                        : "border border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-900/70 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/75 bg-slate-950/40 p-1.5">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Actions
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Button
                className={cn("w-full rounded-xl", quietActionClass)}
                size="sm"
                onClick={() => downloadPdf()}
                variant="secondary"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </Button>
              <Button
                className={cn("w-full rounded-xl", quietActionClass)}
                size="sm"
                onClick={() => downloadPdf("monthly")}
                variant="secondary"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Monthly
              </Button>
              <Button
                className={cn("w-full rounded-xl", quietActionClass)}
                size="sm"
                onClick={() => downloadPdf("yearly")}
                variant="secondary"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Yearly
              </Button>
              <Button
                className={cn("w-full rounded-xl", quietActionClass)}
                size="sm"
                onClick={() => window.print()}
                variant="secondary"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "overview" ? (
        <OverviewPanel dashboard={dashboard} reports={reports} />
      ) : activeTab === "monthly" ? (
        <MonthlyReport
          data={reports.monthly}
          dashboard={dashboard}
          generatedAt={reports.generatedAt}
        />
      ) : activeTab === "yearly" ? (
        <YearlyReport
          data={reports.yearly}
          dashboard={dashboard}
          generatedAt={reports.generatedAt}
        />
      ) : (
        <ExportPanel reports={reports} />
      )}
    </div>
  );
}
