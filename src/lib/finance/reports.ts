import {
  demoDashboardData,
  type DashboardData,
  type RecentTransactionItem
} from "@/lib/finance/dashboard";
import { monthNames } from "@/lib/finance/format";
import type { Account, Budget, Category, Goal, Transaction } from "@/types/entities";

export type MonthlyReportData = {
  label: string;
  income: number;
  expense: number;
  netSavings: number;
  savingsRate: number;
  biggestExpenseCategory: string;
  budgetLimit: number;
  budgetUsedAmount: number;
  budgetUsage: number;
  topTransactions: RecentTransactionItem[];
  categoryBreakdown: { name: string; value: number; color: string }[];
};

export type YearlyReportData = {
  year: number;
  income: number;
  expense: number;
  savings: number;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  bestSavingMonth: string;
  highestSpendingMonth: string;
  monthlyTrend: { month: string; income: number; expense: number; savings: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  topTransactions: RecentTransactionItem[];
  goals: { name: string; current: number; target: number; color: string }[];
};

export type ReportsData = {
  generatedAt: string;
  monthly: MonthlyReportData;
  yearly: YearlyReportData;
  overview: DashboardData["summary"];
};

function parseDateParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function sumTransactions(transactions: Transaction[], type: "income" | "expense") {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Number(transaction.amount ?? 0), 0);
}

function toRecentTransactionItem(
  transaction: Transaction,
  accountMap: Map<string, Account>,
  categoryMap: Map<string, Category>
): RecentTransactionItem {
  const isTransfer = transaction.type === "transfer";
  const fromAccount = accountMap.get(transaction.transfer_from_account_id ?? "")?.name;
  const toAccount = accountMap.get(transaction.transfer_to_account_id ?? "")?.name;
  const category = isTransfer
    ? "Transfer"
    : categoryMap.get(transaction.category_id ?? "")?.name ?? "Uncategorized";
  const account = isTransfer
    ? `${fromAccount ?? "Unknown"} to ${toAccount ?? "Unknown"}`
    : accountMap.get(transaction.account_id ?? "")?.name ?? "Unknown account";

  return {
    id: transaction.id,
    title: transaction.note || category,
    category,
    account,
    type: transaction.type,
    amount: Number(transaction.amount ?? 0),
    date: transaction.date
  };
}

export function buildReportsData({
  accounts,
  budgets,
  categories,
  dashboard,
  goals,
  transactions,
  now = new Date()
}: {
  accounts: Account[];
  budgets: Budget[];
  categories: Category[];
  dashboard: DashboardData;
  goals: Goal[];
  transactions: Transaction[];
  now?: Date;
}): ReportsData {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const monthlyTransactions = transactions.filter((transaction) => {
    const date = parseDateParts(transaction.date);
    return date.month === currentMonth && date.year === currentYear;
  });
  const yearlyTransactions = transactions.filter((transaction) => {
    const date = parseDateParts(transaction.date);
    return date.year === currentYear;
  });

  const monthlyIncome = sumTransactions(monthlyTransactions, "income");
  const monthlyExpense = sumTransactions(monthlyTransactions, "expense");
  const monthlySavings = monthlyIncome - monthlyExpense;
  const monthlySavingsRate =
    monthlyIncome > 0 ? Math.max(0, Math.round((monthlySavings / monthlyIncome) * 100)) : 0;

  const categoryBreakdownMap = new Map<string, { name: string; value: number; color: string }>();
  for (const transaction of monthlyTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const category = categoryMap.get(transaction.category_id ?? "");
    const key = transaction.category_id ?? "uncategorized";
    const existing =
      categoryBreakdownMap.get(key) ??
      {
        name: category?.name ?? "Uncategorized",
        value: 0,
        color: category?.color ?? "#94A3B8"
      };

    existing.value += Number(transaction.amount ?? 0);
    categoryBreakdownMap.set(key, existing);
  }

  const categoryBreakdown = Array.from(categoryBreakdownMap.values()).sort(
    (first, second) => second.value - first.value
  );
  const currentBudgets = budgets.filter(
    (budget) => budget.month === currentMonth && budget.year === currentYear
  );
  const budgetLimit = currentBudgets.reduce(
    (total, budget) => total + Number(budget.limit_amount ?? 0),
    0
  );
  const budgetUsedAmount = currentBudgets.reduce((total, budget) => {
    const used = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" && transaction.category_id === budget.category_id
      )
      .reduce((amount, transaction) => amount + Number(transaction.amount ?? 0), 0);

    return total + used;
  }, 0);
  const budgetUsage =
    budgetLimit > 0 ? Math.min(999, Math.round((budgetUsedAmount / budgetLimit) * 100)) : 0;

  const topTransactions = [...monthlyTransactions]
    .sort((first, second) => {
      const byDate = second.date.localeCompare(first.date);
      if (byDate !== 0) {
        return byDate;
      }

      return Number(second.amount ?? 0) - Number(first.amount ?? 0);
    })
    .slice(0, 10)
    .map((transaction) => toRecentTransactionItem(transaction, accountMap, categoryMap));

  const monthlyTotals = monthNames.map((month, index) => {
    const targetMonth = index + 1;
    const monthTransactions = yearlyTransactions.filter((transaction) => {
      const date = parseDateParts(transaction.date);
      return date.month === targetMonth;
    });
    const income = sumTransactions(monthTransactions, "income");
    const expense = sumTransactions(monthTransactions, "expense");

    return {
      month,
      income,
      expense,
      savings: income - expense
    };
  });
  const yearlyIncome = sumTransactions(yearlyTransactions, "income");
  const yearlyExpense = sumTransactions(yearlyTransactions, "expense");
  const yearlyCategoryBreakdownMap = new Map<
    string,
    { name: string; value: number; color: string }
  >();

  for (const transaction of yearlyTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const category = categoryMap.get(transaction.category_id ?? "");
    const key = transaction.category_id ?? "uncategorized";
    const existing =
      yearlyCategoryBreakdownMap.get(key) ??
      {
        name: category?.name ?? "Uncategorized",
        value: 0,
        color: category?.color ?? "#94A3B8"
      };

    existing.value += Number(transaction.amount ?? 0);
    yearlyCategoryBreakdownMap.set(key, existing);
  }

  const yearlyCategoryBreakdown = Array.from(yearlyCategoryBreakdownMap.values()).sort(
    (first, second) => second.value - first.value
  );
  const yearlyTopTransactions = [...yearlyTransactions]
    .sort((first, second) => {
      const byDate = second.date.localeCompare(first.date);
      if (byDate !== 0) {
        return byDate;
      }

      return Number(second.amount ?? 0) - Number(first.amount ?? 0);
    })
    .slice(0, 10)
    .map((transaction) => toRecentTransactionItem(transaction, accountMap, categoryMap));
  const hasYearlyActivity = yearlyTransactions.length > 0;
  const bestSavingMonth = monthlyTotals.reduce((best, item) =>
    item.savings > best.savings ? item : best
  );
  const highestSpendingMonth = monthlyTotals.reduce((highest, item) =>
    item.expense > highest.expense ? item : highest
  );

  return {
    generatedAt: now.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    monthly: {
      label: `${monthNames[currentMonth - 1]} ${currentYear}`,
      income: monthlyIncome,
      expense: monthlyExpense,
      netSavings: monthlySavings,
      savingsRate: monthlySavingsRate,
      biggestExpenseCategory: categoryBreakdown[0]?.name ?? "No expenses yet",
      budgetLimit,
      budgetUsedAmount,
      budgetUsage,
      topTransactions,
      categoryBreakdown
    },
    yearly: {
      year: currentYear,
      income: yearlyIncome,
      expense: yearlyExpense,
      savings: yearlyIncome - yearlyExpense,
      averageMonthlyIncome: Math.round(yearlyIncome / 12),
      averageMonthlyExpense: Math.round(yearlyExpense / 12),
      bestSavingMonth: hasYearlyActivity ? bestSavingMonth.month : "No data yet",
      highestSpendingMonth: hasYearlyActivity ? highestSpendingMonth.month : "No data yet",
      monthlyTrend: monthlyTotals,
      categoryBreakdown: yearlyCategoryBreakdown,
      topTransactions: yearlyTopTransactions,
      goals: goals.slice(0, 6).map((goal) => ({
        name: goal.name,
        current: Number(goal.current_amount ?? 0),
        target: Number(goal.target_amount ?? 0),
        color: goal.color ?? "#38BDF8"
      }))
    },
    overview: dashboard.summary
  };
}

export function buildDemoReportsData(now = new Date()): ReportsData {
  const currentYear = now.getFullYear();
  const budgetLimit =
    demoDashboardData.summary.budgetUsed > 0
      ? Math.round(
          demoDashboardData.summary.monthlyExpense / (demoDashboardData.summary.budgetUsed / 100)
        )
      : 0;
  const yearlyIncome = demoDashboardData.yearlyTrend.reduce(
    (total, item) => total + item.income,
    0
  );
  const yearlyExpense = demoDashboardData.yearlyTrend.reduce(
    (total, item) => total + item.expense,
    0
  );
  const bestSavingMonth = demoDashboardData.savingsGrowth.reduce((best, item) =>
    item.savings > best.savings ? item : best
  );
  const highestSpendingMonth = demoDashboardData.yearlyTrend.reduce((highest, item) =>
    item.expense > highest.expense ? item : highest
  );

  return {
    generatedAt: now.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    monthly: {
      label: `${monthNames[now.getMonth()]} ${currentYear}`,
      income: demoDashboardData.summary.monthlyIncome,
      expense: demoDashboardData.summary.monthlyExpense,
      netSavings: demoDashboardData.summary.netSavings,
      savingsRate: demoDashboardData.summary.savingsRate,
      biggestExpenseCategory: demoDashboardData.summary.topCategory,
      budgetLimit,
      budgetUsedAmount: demoDashboardData.summary.monthlyExpense,
      budgetUsage: demoDashboardData.summary.budgetUsed,
      topTransactions: demoDashboardData.recentTransactions,
      categoryBreakdown: demoDashboardData.expenseCategories
    },
    yearly: {
      year: currentYear,
      income: yearlyIncome,
      expense: yearlyExpense,
      savings: yearlyIncome - yearlyExpense,
      averageMonthlyIncome: Math.round(yearlyIncome / 12),
      averageMonthlyExpense: Math.round(yearlyExpense / 12),
      bestSavingMonth: bestSavingMonth.month,
      highestSpendingMonth: highestSpendingMonth.month,
      monthlyTrend: demoDashboardData.yearlyTrend.map((item) => ({
        month: item.month,
        income: item.income,
        expense: item.expense,
        savings: item.income - item.expense
      })),
      categoryBreakdown: demoDashboardData.expenseCategories,
      topTransactions: demoDashboardData.recentTransactions,
      goals: demoDashboardData.goalProgress
    },
    overview: demoDashboardData.summary
  };
}
