"use client";

import {
  BriefcaseBusiness,
  Landmark,
  PiggyBank,
  Smartphone,
  TrendingUp,
  Wallet,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/finance/format";
import { accountBalances } from "@/lib/finance/mock-data";
import { cn } from "@/lib/utils";

type AccountBalanceChartProps = {
  data?: typeof accountBalances;
};

function getAccountIcon(name: string): LucideIcon {
  const value = name.toLowerCase();

  if (value.includes("cash")) return Wallet;
  if (value.includes("bca") || value.includes("bank")) return Landmark;
  if (
    value.includes("gopay") ||
    value.includes("ovo") ||
    value.includes("dana") ||
    value.includes("pay")
  ) {
    return Smartphone;
  }
  if (value.includes("saving")) return PiggyBank;
  if (value.includes("business")) return BriefcaseBusiness;
  if (value.includes("invest")) return TrendingUp;

  return WalletCards;
}

export function AccountBalanceChart({ data = accountBalances }: AccountBalanceChartProps) {
  const total = data.reduce((amount, item) => amount + item.balance, 0);
  const positiveTotal = data
    .filter((item) => item.balance > 0)
    .reduce((amount, item) => amount + item.balance, 0);
  const negativeTotal = data
    .filter((item) => item.balance < 0)
    .reduce((amount, item) => amount + Math.abs(item.balance), 0);
  const maxAbsBalance = Math.max(...data.map((item) => Math.abs(item.balance)), 0);
  const sortedAccounts = [...data].sort(
    (first, second) => Math.abs(second.balance) - Math.abs(first.balance)
  );

  return (
    <Card className="dashboard-chart-card self-start overflow-hidden p-4">
      <CardHeader className="mb-2.5 items-start gap-3">
        <div>
          <CardTitle className="text-lg font-black tracking-tight">Account Balances</CardTitle>
          <CardDescription>Executive balance comparison across your money sources.</CardDescription>
        </div>
        <span className="rounded-full border border-indigo-300/20 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-[0_0_18px_rgba(99,102,241,0.10)]">
          Net {formatCompactCurrency(total)}
        </span>
      </CardHeader>

      {sortedAccounts.length === 0 ? (
        <div className="rounded-[1.35rem] border border-slate-800/75 bg-slate-950/34 p-4 text-sm leading-6 text-muted">
          No account balances yet. Create accounts and add transactions to unlock balance
          intelligence.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedAccounts.map((account) => {
            const Icon = getAccountIcon(account.name);
            const isNegative = account.balance < 0;
            const progress =
              maxAbsBalance > 0 ? Math.max(7, (Math.abs(account.balance) / maxAbsBalance) * 100) : 0;

            return (
              <div
                key={account.name}
                className="group rounded-2xl border border-slate-800/72 bg-slate-950/32 p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300/25 hover:bg-slate-900/44 hover:shadow-[0_14px_34px_rgba(0,0,0,0.20),0_0_20px_rgba(99,102,241,0.06)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                        isNegative
                          ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
                          : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{account.name}</p>
                      <p className="text-xs text-muted">Tracked account</p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-right text-sm font-black sm:text-base",
                      isNegative ? "text-rose-200" : "text-cyan-50"
                    )}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-950/88 ring-1 ring-slate-800/70">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      isNegative
                        ? "bg-gradient-to-r from-rose-500/72 via-pink-400/72 to-rose-300/72"
                        : "bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/28 p-2.5 text-muted">
              Positive balances
              <span className="mt-1 block font-bold text-cyan-100">
                {formatCurrency(positiveTotal)}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/28 p-2.5 text-muted">
              Negative exposure
              <span className="mt-1 block font-bold text-rose-200">
                {formatCurrency(negativeTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
