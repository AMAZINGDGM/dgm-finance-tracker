import { monthNames } from "@/lib/finance/format";
import {
  accountBalances as mockAccountBalances,
  dailySpending as mockDailySpending,
  dashboardSummary as mockDashboardSummary,
  expenseCategories as mockExpenseCategories,
  incomeExpenseTrend as mockIncomeExpenseTrend,
  recentTransactions as mockRecentTransactions,
  savingsGrowth as mockSavingsGrowth
} from "@/lib/finance/mock-data";
import type { Account, Budget, Category, Goal, Transaction } from "@/types/entities";

export type RecentTransactionItem = {
  id: string;
  title: string;
  category: string;
  account: string;
  type: string;
  amount: number;
  date: string;
};

export type DashboardData = {
  summary: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    netSavings: number;
    savingsRate: number;
    budgetUsed: number;
    topCategory: string;
  };
  incomeExpenseTrend: { name: string; income: number; expense: number }[];
  expenseCategories: { name: string; value: number; color: string }[];
  dailySpending: { day: string; amount: number }[];
  savingsGrowth: { month: string; savings: number }[];
  accountBalances: { name: string; balance: number }[];
  yearlyTrend: { month: string; income: number; expense: number }[];
  goalProgress: { name: string; current: number; target: number; color: string }[];
  recentTransactions: RecentTransactionItem[];
  isDemo: boolean;
};

export const demoDashboardData: DashboardData = {
  summary: mockDashboardSummary,
  incomeExpenseTrend: mockIncomeExpenseTrend,
  expenseCategories: mockExpenseCategories,
  dailySpending: mockDailySpending,
  savingsGrowth: mockSavingsGrowth,
  accountBalances: mockAccountBalances,
  yearlyTrend: mockSavingsGrowth.map((item, index) => ({
    month: item.month,
    income: mockIncomeExpenseTrend[index % mockIncomeExpenseTrend.length]?.income ?? 0,
    expense: mockIncomeExpenseTrend[index % mockIncomeExpenseTrend.length]?.expense ?? 0
  })),
  goalProgress: [
    { name: "Emergency fund", current: 8000000, target: 15000000, color: "#38BDF8" },
    { name: "Buy laptop", current: 5500000, target: 12000000, color: "#38BDF8" }
  ],
  recentTransactions: mockRecentTransactions,
  isDemo: true
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

export function buildDashboardData({
  accounts,
  budgets = [],
  categories,
  goals = [],
  transactions,
  now = new Date()
}: {
  accounts: Account[];
  budgets?: Budget[];
  categories: Category[];
  goals?: Goal[];
  transactions: Transaction[];
  now?: Date;
}): DashboardData {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const monthlyTransactions = transactions.filter((transaction) => {
    const date = parseDateParts(transaction.date);
    return date.month === currentMonth && date.year === currentYear;
  });

  const monthlyIncome = sumTransactions(monthlyTransactions, "income");
  const monthlyExpense = sumTransactions(monthlyTransactions, "expense");
  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (netSavings / monthlyIncome) * 100) : 0;
  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.current_balance ?? 0),
    0
  );

  const expenseByCategory = new Map<string, { name: string; value: number; color: string }>();

  for (const transaction of monthlyTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const category = transaction.category_id
      ? categoryMap.get(transaction.category_id)
      : undefined;
    const key = transaction.category_id ?? "uncategorized";
    const existing =
      expenseByCategory.get(key) ??
      {
        name: category?.name ?? "Uncategorized",
        value: 0,
        color: category?.color ?? "#94A3B8"
      };

    existing.value += Number(transaction.amount ?? 0);
    expenseByCategory.set(key, existing);
  }

  const expenseCategories = Array.from(expenseByCategory.values()).sort(
    (first, second) => second.value - first.value
  );

  const topCategory = expenseCategories[0]?.name ?? "No expenses yet";
  const currentBudgets = budgets.filter(
    (budget) => budget.month === currentMonth && budget.year === currentYear
  );
  const totalBudgetLimit = currentBudgets.reduce(
    (total, budget) => total + Number(budget.limit_amount ?? 0),
    0
  );
  const totalBudgetUsed = currentBudgets.reduce((total, budget) => {
    const used = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" && transaction.category_id === budget.category_id
      )
      .reduce((amount, transaction) => amount + Number(transaction.amount ?? 0), 0);

    return total + used;
  }, 0);
  const budgetUsed =
    totalBudgetLimit > 0 ? Math.min(999, Math.round((totalBudgetUsed / totalBudgetLimit) * 100)) : 0;

  const incomeExpenseTrend = Array.from({ length: 5 }, (_, index) => ({
    name: `W${index + 1}`,
    income: 0,
    expense: 0
  }));

  for (const transaction of monthlyTransactions) {
    const { day } = parseDateParts(transaction.date);
    const weekIndex = Math.min(4, Math.floor((day - 1) / 7));

    if (transaction.type === "income") {
      incomeExpenseTrend[weekIndex].income += Number(transaction.amount ?? 0);
    } else if (transaction.type === "expense") {
      incomeExpenseTrend[weekIndex].expense += Number(transaction.amount ?? 0);
    }
  }

  const dailySpendingMap = new Map<string, number>();
  for (const transaction of monthlyTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const { day } = parseDateParts(transaction.date);
    const key = String(day);
    dailySpendingMap.set(key, (dailySpendingMap.get(key) ?? 0) + Number(transaction.amount ?? 0));
  }

  const dailySpending = Array.from(dailySpendingMap.entries()).map(([day, amount]) => ({
    day,
    amount
  }));

  let cumulativeSavings = 0;
  const savingsGrowth = Array.from({ length: currentMonth }, (_, index) => {
    const month = index + 1;
    const monthTransactions = transactions.filter((transaction) => {
      const date = parseDateParts(transaction.date);
      return date.month === month && date.year === currentYear;
    });
    cumulativeSavings +=
      sumTransactions(monthTransactions, "income") - sumTransactions(monthTransactions, "expense");

    return {
      month: monthNames[index].slice(0, 3),
      savings: cumulativeSavings
    };
  });

  const yearlyTrend = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthTransactions = transactions.filter((transaction) => {
      const date = parseDateParts(transaction.date);
      return date.month === month && date.year === currentYear;
    });

    return {
      month: monthNames[index].slice(0, 3),
      income: sumTransactions(monthTransactions, "income"),
      expense: sumTransactions(monthTransactions, "expense")
    };
  });

  const accountBalances = accounts.map((account) => ({
    name: account.name,
    balance: Number(account.current_balance ?? 0)
  }));

  const recentTransactions = transactions.slice(0, 6).map((transaction) => {
    const isTransfer = transaction.type === "transfer";
    const fromAccount = accountMap.get(transaction.transfer_from_account_id ?? "")?.name;
    const toAccount = accountMap.get(transaction.transfer_to_account_id ?? "")?.name;
    const account = isTransfer
      ? `${fromAccount ?? "Unknown"} to ${toAccount ?? "Unknown"}`
      : accountMap.get(transaction.account_id ?? "")?.name ?? "Unknown account";
    const category = isTransfer
      ? "Transfer"
      : categoryMap.get(transaction.category_id ?? "")?.name ?? "Uncategorized";

    return {
      id: transaction.id,
      title: transaction.note || category,
      category,
      account,
      type: transaction.type,
      amount: Number(transaction.amount ?? 0),
      date: transaction.date
    };
  });

  const goalProgress = goals.slice(0, 4).map((goal) => ({
    name: goal.name,
    current: Number(goal.current_amount ?? 0),
    target: Number(goal.target_amount ?? 0),
    color: goal.color ?? "#38BDF8"
  }));

  return {
    summary: {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings,
      savingsRate: Math.round(savingsRate),
      budgetUsed,
      topCategory
    },
    incomeExpenseTrend,
    expenseCategories:
      expenseCategories.length > 0
        ? expenseCategories
        : [{ name: "No expenses", value: 1, color: "#1E293B" }],
    dailySpending: dailySpending.length > 0 ? dailySpending : [{ day: "0", amount: 0 }],
    savingsGrowth: savingsGrowth.length > 0 ? savingsGrowth : [{ month: "Now", savings: 0 }],
    accountBalances,
    yearlyTrend,
    goalProgress,
    recentTransactions,
    isDemo: false
  };
}
