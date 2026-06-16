export const dashboardSummary = {
  totalBalance: 18450000,
  monthlyIncome: 7200000,
  monthlyExpense: 3850000,
  netSavings: 3350000,
  savingsRate: 46,
  budgetUsed: 68,
  topCategory: "Food & Drinks"
};

export const incomeExpenseTrend = [
  { name: "W1", income: 1800000, expense: 760000 },
  { name: "W2", income: 1200000, expense: 980000 },
  { name: "W3", income: 2600000, expense: 1050000 },
  { name: "W4", income: 1600000, expense: 1060000 }
];

export const expenseCategories = [
  { name: "Food", value: 1250000, color: "#38BDF8" },
  { name: "Transport", value: 610000, color: "#38BDF8" },
  { name: "Bills", value: 820000, color: "#F43F5E" },
  { name: "Shopping", value: 540000, color: "#F43F5E" },
  { name: "Other", value: 630000, color: "#94A3B8" }
];

export const dailySpending = [
  { day: "1", amount: 150000 },
  { day: "5", amount: 280000 },
  { day: "9", amount: 90000 },
  { day: "13", amount: 420000 },
  { day: "17", amount: 210000 },
  { day: "21", amount: 360000 },
  { day: "25", amount: 175000 },
  { day: "29", amount: 310000 }
];

export const savingsGrowth = [
  { month: "Jan", savings: 2100000 },
  { month: "Feb", savings: 2800000 },
  { month: "Mar", savings: 2300000 },
  { month: "Apr", savings: 3200000 },
  { month: "May", savings: 3350000 }
];

export const accountBalances = [
  { name: "Cash", balance: 950000 },
  { name: "BCA", balance: 8900000 },
  { name: "GoPay", balance: 600000 },
  { name: "Savings", balance: 8000000 }
];

export const recentTransactions = [
  {
    id: "demo-1",
    title: "Freelance design",
    category: "Freelance",
    account: "BCA",
    type: "income",
    amount: 2000000,
    date: "Today"
  },
  {
    id: "demo-2",
    title: "GoFood lunch",
    category: "Food & Drinks",
    account: "GoPay",
    type: "expense",
    amount: 58000,
    date: "Today"
  },
  {
    id: "demo-3",
    title: "Monthly subscription",
    category: "Subscription",
    account: "BCA",
    type: "expense",
    amount: 129000,
    date: "Yesterday"
  },
  {
    id: "demo-4",
    title: "Move to savings",
    category: "Transfer",
    account: "Savings",
    type: "transfer",
    amount: 1000000,
    date: "May 24"
  }
];

export const goalProgress = [
  { name: "Emergency fund", current: 8000000, target: 15000000, color: "#38BDF8" },
  { name: "Buy laptop", current: 5500000, target: 12000000, color: "#38BDF8" }
];
