import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus, ReceiptText, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentTransactionItem } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";
import { recentTransactions as mockRecentTransactions } from "@/lib/finance/mock-data";
import { cn } from "@/lib/utils";

type RecentTransactionsProps = {
  transactions?: RecentTransactionItem[];
  demo?: boolean;
};

export function RecentTransactions({
  transactions = mockRecentTransactions,
  demo = true
}: RecentTransactionsProps) {
  return (
    <Card className="dashboard-secondary-card overflow-hidden">
      <CardHeader className="items-start">
        <div>
          <CardTitle className="text-xl font-black tracking-tight">Recent Transactions</CardTitle>
          <CardDescription>Latest financial movement across your accounts.</CardDescription>
        </div>
        <Badge tone={demo ? "slate" : "accent"}>{demo ? "Demo data" : "Live data"}</Badge>
      </CardHeader>
      {transactions.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/25 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-soft">
            <ReceiptText className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-4 font-bold text-white">No ledger activity yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Add your first transaction to turn this dashboard into a real finance workspace.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-sky/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:-translate-y-0.5 hover:border-accent/45 hover:bg-sky/20"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add transaction
            </Link>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/45 px-4 py-2 text-xs font-bold text-slate-300 transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-cyan-100"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Try AI Quick Add
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === "income";
            const isTransfer = transaction.type === "transfer";
            const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowDownLeft : ArrowUpRight;

            return (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:bg-slate-900/55 hover:shadow-[0_18px_58px_rgba(34,211,238,0.07)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      isIncome
                        ? "border-income/20 bg-income/10 text-green-300"
                        : isTransfer
                          ? "border-sky/20 bg-sky/10 text-sky-200"
                          : "border-expense/20 bg-expense/10 text-red-300"
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{transaction.title}</p>
                    <p className="truncate text-xs text-muted">
                      {transaction.category} - {transaction.account} - {transaction.date}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-sm font-bold sm:text-right",
                    isIncome ? "text-green-300" : isTransfer ? "text-sky-200" : "text-red-300"
                  )}
                >
                  {isIncome ? "+" : isTransfer ? "" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
