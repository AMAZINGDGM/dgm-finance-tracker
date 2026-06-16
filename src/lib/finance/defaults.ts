import type { AccountType, CategoryType } from "@/types/finance";

export type DefaultAccount = {
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  color: string;
  icon: string;
};

export type DefaultCategory = {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

export const defaultAccounts: DefaultAccount[] = [
  {
    name: "Cash",
    type: "cash",
    initial_balance: 0,
    current_balance: 0,
    color: "#38BDF8",
    icon: "Wallet"
  },
  {
    name: "BCA",
    type: "bank",
    initial_balance: 0,
    current_balance: 0,
    color: "#38BDF8",
    icon: "Landmark"
  },
  {
    name: "GoPay",
    type: "e-wallet",
    initial_balance: 0,
    current_balance: 0,
    color: "#22C55E",
    icon: "Smartphone"
  },
  {
    name: "Savings",
    type: "savings",
    initial_balance: 0,
    current_balance: 0,
    color: "#A78BFA",
    icon: "PiggyBank"
  }
];

export const defaultCategories: DefaultCategory[] = [
  { name: "Allowance", type: "income", color: "#22C55E", icon: "HandCoins" },
  { name: "Salary", type: "income", color: "#16A34A", icon: "Briefcase" },
  { name: "Freelance", type: "income", color: "#38BDF8", icon: "Laptop" },
  { name: "Money from Davenue", type: "income", color: "#22D3EE", icon: "Store" },
  { name: "Gift", type: "income", color: "#F472B6", icon: "Gift" },
  { name: "Investment", type: "income", color: "#A78BFA", icon: "TrendingUp" },
  { name: "Other Income", type: "income", color: "#94A3B8", icon: "Plus" },
  { name: "Food & Drinks", type: "expense", color: "#F43F5E", icon: "Utensils" },
  { name: "Transport", type: "expense", color: "#38BDF8", icon: "Car" },
  { name: "Shopping", type: "expense", color: "#F43F5E", icon: "ShoppingBag" },
  { name: "Education", type: "expense", color: "#A78BFA", icon: "GraduationCap" },
  { name: "Entertainment", type: "expense", color: "#6366F1", icon: "Gamepad2" },
  { name: "Bills", type: "expense", color: "#F43F5E", icon: "ReceiptText" },
  { name: "Health", type: "expense", color: "#22C55E", icon: "HeartPulse" },
  { name: "Subscription", type: "expense", color: "#60A5FA", icon: "RefreshCcw" },
  { name: "Emergency", type: "expense", color: "#F43F5E", icon: "ShieldAlert" },
  { name: "Family", type: "expense", color: "#F472B6", icon: "Users" },
  { name: "Capital to Davenue", type: "expense", color: "#6366F1", icon: "HandCoins" },
  { name: "Other Expense", type: "expense", color: "#94A3B8", icon: "Minus" }
];
