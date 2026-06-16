import { CalendarDays, Gauge, PiggyBank, ShieldAlert, WalletCards } from "lucide-react";
import { cookies } from "next/headers";

import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/config/public";
import { buildDashboardData, demoDashboardData, type DashboardData } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";
import { getServerProfileName } from "@/lib/supabase/profile";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  getWorkspaceScopedQuery,
  pickActiveWorkspace
} from "@/lib/workspaces";
import type { Account, Budget, Category, Goal, Transaction } from "@/types/entities";
import type { Workspace } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type DashboardPayload = {
  activeWorkspace: Workspace | null;
  dashboard: DashboardData;
  userName: string;
  workspaces: Workspace[];
};

type QuickActionIconKey = "file" | "gauge" | "plus" | "target";

type PlainQuickAction = {
  description: string;
  href: string;
  icon: QuickActionIconKey;
  title: string;
};

function getGreeting(now = new Date()) {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good evening";
  }

  return "Good night";
}

function getFirstName(value?: string | null) {
  const firstName = value?.trim().split(/\s+/)[0];
  return firstName && firstName.length > 0 ? firstName : "Dgm";
}

async function getDashboardData(): Promise<DashboardPayload> {
  if (!isSupabaseConfigured()) {
    return { activeWorkspace: null, dashboard: demoDashboardData, userName: "Dgm", workspaces: [] };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { activeWorkspace: null, dashboard: demoDashboardData, userName: "Dgm", workspaces: [] };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { activeWorkspace: null, dashboard: demoDashboardData, userName: "Dgm", workspaces: [] };
  }

  const profileName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  const workspaces = await getUserWorkspaces(supabase, user.id);
  const cookieStore = await cookies();
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    cookieStore.get(activeWorkspaceCookieName)?.value
  );

  const [
    storedProfileName,
    accountsResult,
    categoriesResult,
    transactionsResult,
    budgetsResult,
    goalsResult
  ] = await Promise.all([
    getServerProfileName(user.id),
    getWorkspaceScopedQuery(
      supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at"),
      activeWorkspace?.id
    ),
    getWorkspaceScopedQuery(
      supabase.from("categories").select("*").eq("user_id", user.id),
      activeWorkspace?.id
    ),
    getWorkspaceScopedQuery(
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      activeWorkspace?.id
    ),
    getWorkspaceScopedQuery(
      supabase.from("budgets").select("*").eq("user_id", user.id),
      activeWorkspace?.id
    ),
    getWorkspaceScopedQuery(
      supabase.from("goals").select("*").eq("user_id", user.id).order("deadline"),
      activeWorkspace?.id
    )
  ]);

  const userName = getFirstName(storedProfileName ?? profileName);

  if (
    accountsResult.error ||
    categoriesResult.error ||
    transactionsResult.error ||
    budgetsResult.error ||
    goalsResult.error
  ) {
    return { activeWorkspace, dashboard: demoDashboardData, userName, workspaces };
  }

  return {
    activeWorkspace,
    dashboard: buildDashboardData({
      accounts: (accountsResult.data ?? []) as Account[],
      budgets: (budgetsResult.data ?? []) as Budget[],
      categories: (categoriesResult.data ?? []) as Category[],
      goals: (goalsResult.data ?? []) as Goal[],
      transactions: (transactionsResult.data ?? []) as Transaction[]
    }),
    userName,
    workspaces
  };
}

export default async function DashboardPage() {
  const { activeWorkspace, dashboard, userName } = await getDashboardData();
  const dashboardSummary = dashboard.summary;
  const isBusinessWorkspace = activeWorkspace?.type === "business";
  const greeting = getGreeting();
  const currentDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short"
  }).format(new Date());
  const budgetState =
    dashboardSummary.budgetUsed >= 100
      ? "Danger"
      : dashboardSummary.budgetUsed >= 75
        ? "Warning"
        : "Healthy";
  const budgetTone =
    dashboardSummary.budgetUsed >= 100
      ? "red"
      : dashboardSummary.budgetUsed >= 75
        ? "warning"
        : "blue";
  const hasSpendingPattern = dashboardSummary.topCategory !== "No expenses yet";
  const topCategoryValue = hasSpendingPattern ? dashboardSummary.topCategory : "No pattern yet";
  const topCategoryHelper = hasSpendingPattern
    ? "Biggest spend this month"
    : "Add expenses to unlock insights";

  const overviewMetrics = [
    {
      label: "Total Balance",
      value: formatCurrency(dashboardSummary.totalBalance),
      helper: "Across accounts",
      className: "text-white"
    },
    {
      label: isBusinessWorkspace ? "Sales" : "Income",
      value: formatCurrency(dashboardSummary.monthlyIncome),
      helper: isBusinessWorkspace ? "Business revenue" : "This month",
      className: "text-green-300"
    },
    {
      label: isBusinessWorkspace ? "Business Expense" : "Expense",
      value: formatCurrency(dashboardSummary.monthlyExpense),
      helper: isBusinessWorkspace ? "Operating costs" : "This month",
      className: "text-red-300"
    },
    {
      label: isBusinessWorkspace ? "Profit Rate" : "Savings Rate",
      value: `${dashboardSummary.savingsRate}%`,
      helper: isBusinessWorkspace ? "Revenue retained" : "Income saved",
      className: "text-cyan-200"
    }
  ];

  const quickActions: PlainQuickAction[] = [
    {
      href: "/transactions",
      title: "Add transaction",
      description: "Record a new ledger item.",
      icon: "plus"
    },
    {
      href: "/reports",
      title: "Smart reports",
      description: "Review performance.",
      icon: "file"
    },
    {
      href: "/budgets",
      title: "Budget control",
      description: "Check monthly limits.",
      icon: "gauge"
    },
    {
      href: "/goals",
      title: "Goal tracking",
      description: "Track savings progress.",
      icon: "target"
    }
  ];

  return (
    <div className="dashboard-enter min-w-0 max-w-full space-y-3 overflow-x-hidden pb-28 lg:pb-24 xl:pb-12">
      <section className="dashboard-hero relative overflow-hidden rounded-[1.75rem] border border-slate-800/70 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.30),0_0_34px_rgba(34,211,238,0.045)] sm:p-5 xl:p-6">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="dashboard-hero-glow dashboard-hero-glow-one" aria-hidden="true" />
        <div className="dashboard-hero-glow dashboard-hero-glow-two" aria-hidden="true" />

        <div className="relative flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              {dashboard.isDemo || !activeWorkspace ? (
                <Badge tone="slate">Demo Mode</Badge>
              ) : (
                <Badge tone="accent">{activeWorkspace.name}</Badge>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800/90 bg-slate-950/40 px-3 py-1 text-xs font-medium text-slate-300">
                <CalendarDays className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" />
                {currentDate}
              </span>
            </div>

            <h1 className="max-w-4xl text-balance text-3xl font-black tracking-tight text-white sm:text-4xl xl:text-[2.65rem]">
              {greeting}, {userName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {isBusinessWorkspace
                ? "A cleaner view of sales, business expenses, capital movement, and cashflow health."
                : "A cleaner view of your balance, cashflow, and financial momentum for today."}
            </p>
          </div>

          <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:w-full xl:max-w-[620px] xl:grid-cols-4">
            {overviewMetrics.map((item) => (
              <div key={item.label} className="dashboard-hero-metric rounded-[1.15rem] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className={`mt-2 truncate text-lg font-black tracking-tight ${item.className}`}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-muted">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title={isBusinessWorkspace ? "Estimated Profit" : "Net Savings"}
          value={formatCurrency(dashboardSummary.netSavings)}
          helper={isBusinessWorkspace ? "Revenue minus costs" : "Income minus expenses"}
          icon={PiggyBank}
          tone="blue"
          trend="Cashflow result"
        />
        <SummaryCard
          title={isBusinessWorkspace ? "Expense Control" : "Budget Used"}
          value={`${Math.round(dashboardSummary.budgetUsed)}%`}
          helper={`${budgetState} budget status`}
          icon={Gauge}
          tone={budgetTone}
          trend="Monthly control"
        />
        <SummaryCard
          title={isBusinessWorkspace ? "Top Cost Area" : "Top Category"}
          value={topCategoryValue}
          helper={topCategoryHelper}
          icon={ShieldAlert}
          tone="accent"
          trend={hasSpendingPattern ? "Spending focus" : "Awaiting data"}
        />
        <SummaryCard
          title={isBusinessWorkspace ? "Business Accounts" : "Accounts"}
          value={String(dashboard.accountBalances.length)}
          helper="Tracked balance sources"
          icon={WalletCards}
          tone="blue"
          trend={dashboard.isDemo ? "Demo preview" : "Live data"}
        />
      </section>

      <DashboardAnalytics
        demo={dashboard.isDemo}
        budgetUsed={dashboardSummary.budgetUsed}
        dailySpending={dashboard.dailySpending}
        expenseCategories={dashboard.expenseCategories}
        goalProgress={dashboard.goalProgress}
        incomeExpenseTrend={dashboard.incomeExpenseTrend}
        quickActions={quickActions}
        recentTransactions={dashboard.recentTransactions}
      />
    </div>
  );
}
