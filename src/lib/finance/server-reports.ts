import "server-only";

import { cookies } from "next/headers";

import { isSupabaseConfigured } from "@/lib/config/public";
import { buildDashboardData, demoDashboardData } from "@/lib/finance/dashboard";
import { buildDemoReportsData, buildReportsData, type ReportsData } from "@/lib/finance/reports";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  getWorkspaceScopedQuery,
  pickActiveWorkspace
} from "@/lib/workspaces";
import type { Account, Budget, Category, Goal, Transaction } from "@/types/entities";
import type { DashboardData } from "@/lib/finance/dashboard";

export type ReportsDataset = {
  dashboard: DashboardData;
  reports: ReportsData;
  isDemo: boolean;
};

export async function getReportsDataset(): Promise<ReportsDataset> {
  if (!isSupabaseConfigured()) {
    return {
      dashboard: demoDashboardData,
      reports: buildDemoReportsData(),
      isDemo: true
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      dashboard: demoDashboardData,
      reports: buildDemoReportsData(),
      isDemo: true
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      dashboard: demoDashboardData,
      reports: buildDemoReportsData(),
      isDemo: true
    };
  }

  const workspaces = await getUserWorkspaces(supabase, user.id);
  const cookieStore = await cookies();
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    cookieStore.get(activeWorkspaceCookieName)?.value
  );

  const [accountsResult, categoriesResult, transactionsResult, budgetsResult, goalsResult] =
    await Promise.all([
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

  if (
    accountsResult.error ||
    categoriesResult.error ||
    transactionsResult.error ||
    budgetsResult.error ||
    goalsResult.error
  ) {
    return {
      dashboard: demoDashboardData,
      reports: buildDemoReportsData(),
      isDemo: true
    };
  }

  const accounts = (accountsResult.data ?? []) as Account[];
  const budgets = (budgetsResult.data ?? []) as Budget[];
  const categories = (categoriesResult.data ?? []) as Category[];
  const goals = (goalsResult.data ?? []) as Goal[];
  const transactions = (transactionsResult.data ?? []) as Transaction[];
  const dashboard = buildDashboardData({
    accounts,
    budgets,
    categories,
    goals,
    transactions
  });

  return {
    dashboard,
    reports: buildReportsData({
      accounts,
      budgets,
      categories,
      dashboard,
      goals,
      transactions
    }),
    isDemo: false
  };
}
