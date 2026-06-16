import type { Database } from "@/types/database";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type CapitalEntry = Database["public"]["Tables"]["capital_entries"]["Row"];

export type TransactionWithLabels = Transaction & {
  categoryName: string;
  accountName: string;
};
