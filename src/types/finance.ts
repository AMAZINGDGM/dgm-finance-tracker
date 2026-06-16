export type TransactionType = "income" | "expense" | "transfer";

export type AccountType =
  | "cash"
  | "bank"
  | "e-wallet"
  | "savings"
  | "business"
  | "investment"
  | "other";

export type CategoryType = "income" | "expense";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type GoalStatus = "on track" | "behind" | "completed";

export type LanguageCode = "en" | "id";

export type ParsedFinanceMode = "openai" | "rule-based-fallback";

export type ParsedTransaction = {
  type: TransactionType;
  amount: number;
  category?: string;
  category_id?: string | null;
  date?: string;
  account?: string;
  account_id?: string | null;
  transfer_from_account?: string;
  transfer_from_account_id?: string | null;
  transfer_to_account?: string;
  transfer_to_account_id?: string | null;
  note?: string;
  languageDetected?: LanguageCode | "mixed";
  confidence?: number;
  clarificationQuestion?: string;
  parser?: ParsedFinanceMode;
  rawMessage?: string;
};
