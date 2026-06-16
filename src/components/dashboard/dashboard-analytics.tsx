"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { FileText, Gauge, Plus, Target, WalletCards } from "lucide-react";

import { BudgetStatusCard } from "@/components/dashboard/budget-status-card";
import { GoalProgressCard } from "@/components/dashboard/goal-progress-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import type { DashboardData, RecentTransactionItem } from "@/lib/finance/dashboard";

type PlainTrendPoint = {
  name: string;
  income: number;
  expense: number;
};

type PlainExpenseCategory = {
  name: string;
  value: number;
  color: string;
};

type PlainDailySpending = {
  day: string;
  amount: number;
};

type PlainGoalProgress = {
  name: string;
  current: number;
  target: number;
  color: string;
};

type PlainRecentTransaction = RecentTransactionItem;

type PlainQuickActionIcon = "file" | "gauge" | "plus" | "target" | "wallet";

type PlainQuickAction = {
  description: string;
  href: string;
  icon: PlainQuickActionIcon;
  title: string;
};

type IncomeExpenseChartProps = {
  data?: PlainTrendPoint[];
};

type ExpenseCategoryChartProps = {
  data?: PlainExpenseCategory[];
};

type DailySpendingChartProps = {
  data?: PlainDailySpending[];
};

type DashboardAnalyticsProps = {
  budgetUsed?: number;
  dailySpending?: PlainDailySpending[];
  demo?: boolean;
  expenseCategories?: PlainExpenseCategory[];
  goalProgress?: PlainGoalProgress[];
  incomeExpenseTrend?: PlainTrendPoint[];
  quickActions?: PlainQuickAction[];
  recentTransactions?: PlainRecentTransaction[];
};

const quickActionIconMap = {
  file: FileText,
  gauge: Gauge,
  plus: Plus,
  target: Target,
  wallet: WalletCards
} satisfies Record<PlainQuickActionIcon, typeof Plus>;

function ChartSkeleton({
  description,
  height = "h-56",
  title
}: {
  description: string;
  height?: string;
  title: string;
}) {
  return (
    <Card className="dashboard-chart-card overflow-hidden">
      <CardHeader className="items-start">
        <div>
          <CardTitle className="text-xl font-black tracking-tight">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <LoadingSkeleton className={height} />
    </Card>
  );
}

const IncomeExpenseChart = dynamic<IncomeExpenseChartProps>(
  () =>
    import("@/components/charts/income-expense-chart").then(
      (module) => module.IncomeExpenseChart
    ),
  {
    loading: () => (
      <ChartSkeleton
        title="Cashflow Momentum"
        description="Preparing income and expense trend."
      />
    ),
    ssr: false
  }
);

const ExpenseCategoryChart = dynamic<ExpenseCategoryChartProps>(
  () =>
    import("@/components/charts/expense-category-chart").then(
      (module) => module.ExpenseCategoryChart
    ),
  {
    loading: () => (
      <ChartSkeleton
        title="Category Distribution"
        description="Preparing spending categories."
      />
    ),
    ssr: false
  }
);

const DailySpendingChart = dynamic<DailySpendingChartProps>(
  () =>
    import("@/components/charts/daily-spending-chart").then(
      (module) => module.DailySpendingChart
    ),
  {
    loading: () => (
      <ChartSkeleton
        title="Daily Spending"
        description="Preparing daily spending intensity."
        height="h-44"
      />
    ),
    ssr: false
  }
);

export function DashboardAnalytics({
  budgetUsed = 0,
  dailySpending = [],
  demo = false,
  expenseCategories = [],
  goalProgress = [],
  incomeExpenseTrend = [],
  quickActions = [],
  recentTransactions = []
}: DashboardAnalyticsProps) {
  return (
    <section className="dashboard-analytics-grid grid min-w-0 max-w-full items-start gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 max-w-full gap-3">
        <IncomeExpenseChart data={incomeExpenseTrend} />
        <DailySpendingChart data={dailySpending} />
        <RecentTransactions transactions={recentTransactions} demo={demo} />
      </div>

      <aside className="grid min-w-0 max-w-full content-start gap-3">
        <ExpenseCategoryChart data={expenseCategories} />
        <div className="grid content-start gap-3 md:grid-cols-2 xl:grid-cols-1">
          <BudgetStatusCard value={budgetUsed} />
          <GoalProgressCard goals={goalProgress} />
        </div>
        <div className="dashboard-tools-card relative overflow-hidden rounded-[1.35rem] border border-slate-800/70 p-3.5 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
                Finance Tools
              </p>
              <h2 className="mt-1.5 text-lg font-black text-white">Quick actions</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Keep daily finance workflows within easy reach.
              </p>
            </div>
            <div className="rounded-2xl border border-accent/20 bg-accent/10 p-2.5 text-accent-soft">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-2.5">
            {quickActions.map((action) => {
              const Icon = quickActionIconMap[action.icon] ?? WalletCards;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/28 p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-slate-900/48 hover:shadow-[0_16px_46px_rgba(34,211,238,0.07)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent-soft transition group-hover:scale-105">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">{action.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {action.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </section>
  );
}
