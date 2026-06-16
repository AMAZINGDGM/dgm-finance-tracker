"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  Flame,
  Layers3,
  Plus,
  Sparkles,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCurrency, monthNames } from "@/lib/finance/format";
import { requestJson } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types/entities";
import type { TransactionType } from "@/types/finance";

type DayStats = {
  count: number;
  expense: number;
  income: number;
  net: number;
  transfer: number;
  transactions: Transaction[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date();
const currentYear = today.getFullYear();
const minimumYear = currentYear - 10;
const maximumYear = currentYear + 10;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function monthDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthBounds(year: number, month: number) {
  const first = monthDateKey(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = monthDateKey(year, month, lastDay);

  return { first, last, lastDay };
}

function getPreferredSelectedDate(year: number, month: number) {
  if (year === today.getFullYear() && month === today.getMonth()) {
    return toDateKey(today);
  }

  return monthDateKey(year, month, 1);
}

function createEmptyDayStats(): DayStats {
  return {
    count: 0,
    expense: 0,
    income: 0,
    net: 0,
    transfer: 0,
    transactions: []
  };
}

function getTransactionTone(type: TransactionType) {
  if (type === "income") {
    return {
      amountClass: "text-green-300",
      badgeTone: "green" as const,
      icon: ArrowDownLeft,
      prefix: "+"
    };
  }

  if (type === "expense") {
    return {
      amountClass: "text-expense",
      badgeTone: "red" as const,
      icon: ArrowUpRight,
      prefix: "-"
    };
  }

  return {
    amountClass: "text-cyan-200",
    badgeTone: "blue" as const,
    icon: ArrowLeftRight,
    prefix: ""
  };
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function CalendarManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const { first, last, lastDay } = useMemo(
    () => monthBounds(viewYear, viewMonth),
    [viewMonth, viewYear]
  );

  async function loadData() {
    setLoading(true);
    try {
      const [transactionsData, categoriesData, accountsData] = await Promise.all([
        requestJson<{ transactions: Transaction[] }>(
          `/api/transactions?date_from=${first}&date_to=${last}`
        ),
        requestJson<{ categories: Category[] }>("/api/categories"),
        requestJson<{ accounts: Account[] }>("/api/accounts")
      ]);

      setTransactions(transactionsData.transactions);
      setCategories(categoriesData.categories);
      setAccounts(accountsData.accounts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load calendar data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, last]);

  useEffect(() => {
    if (selectedDate < first || selectedDate > last) {
      setSelectedDate(getPreferredSelectedDate(viewYear, viewMonth));
    }
  }, [first, last, selectedDate, viewMonth, viewYear]);

  const dayMap = useMemo(() => {
    const map = new Map<string, DayStats>();

    for (const transaction of transactions) {
      const current = map.get(transaction.date) ?? createEmptyDayStats();
      const amount = Number(transaction.amount ?? 0);

      current.count += 1;
      current.transactions.push(transaction);

      if (transaction.type === "income") {
        current.income += amount;
      } else if (transaction.type === "expense") {
        current.expense += amount;
      } else {
        current.transfer += amount;
      }

      current.net = current.income - current.expense;
      map.set(transaction.date, current);
    }

    return map;
  }, [transactions]);

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfers = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount ?? 0);

      if (transaction.type === "income") {
        income += amount;
      } else if (transaction.type === "expense") {
        expense += amount;
      } else {
        transfers += amount;
      }
    }

    const highestSpending = Array.from(dayMap.entries())
      .filter(([, stats]) => stats.expense > 0)
      .sort(([, firstStats], [, secondStats]) => secondStats.expense - firstStats.expense)[0];

    return {
      activeDays: dayMap.size,
      expense,
      highestSpending,
      income,
      net: income - expense,
      transfers
    };
  }, [dayMap, transactions]);

  const calendarCells = useMemo(() => {
    const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay();
    const cells: ({ date: string; day: number } | null)[] = [];

    for (let index = 0; index < leadingBlanks; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= lastDay; day += 1) {
      cells.push({
        date: monthDateKey(viewYear, viewMonth, day),
        day
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [lastDay, viewMonth, viewYear]);

  const yearOptions = useMemo(() => {
    return Array.from(
      { length: maximumYear - minimumYear + 1 },
      (_, index) => minimumYear + index
    );
  }, []);

  const selectedStats = dayMap.get(selectedDate) ?? createEmptyDayStats();
  const todayKey = toDateKey(today);
  const highestSpendingDate = monthSummary.highestSpending?.[0];
  const canMovePrevious = viewYear > minimumYear || viewMonth > 0;
  const canMoveNext = viewYear < maximumYear || viewMonth < 11;

  function moveMonth(offset: number) {
    const next = new Date(viewYear, viewMonth + offset, 1);
    const nextYear = next.getFullYear();

    if (nextYear < minimumYear || nextYear > maximumYear) {
      return;
    }

    setViewMonth(next.getMonth());
    setViewYear(nextYear);
    setSelectedDate(getPreferredSelectedDate(nextYear, next.getMonth()));
    setMonthPickerOpen(false);
  }

  function moveToCurrentMonth() {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    setSelectedDate(todayKey);
    setMonthPickerOpen(false);
  }

  function selectMonth(month: number, year: number) {
    if (year < minimumYear || year > maximumYear) {
      return;
    }

    setViewMonth(month);
    setViewYear(year);
    setSelectedDate(getPreferredSelectedDate(year, month));
    setMonthPickerOpen(false);
  }

  function getCategoryLabel(transaction: Transaction) {
    if (transaction.type === "transfer") {
      return "Transfer";
    }

    return categoryMap.get(transaction.category_id ?? "")?.name ?? "Uncategorized";
  }

  function getAccountLabel(transaction: Transaction) {
    if (transaction.type === "transfer") {
      const from = accountMap.get(transaction.transfer_from_account_id ?? "")?.name ?? "Unknown";
      const to = accountMap.get(transaction.transfer_to_account_id ?? "")?.name ?? "Unknown";

      return `${from} to ${to}`;
    }

    return accountMap.get(transaction.account_id ?? "")?.name ?? "Unknown account";
  }

  return (
    <div className="space-y-4 pb-20">
      <section className="relative overflow-hidden rounded-[1.35rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.13),transparent_24%),linear-gradient(135deg,rgba(3,7,18,0.99),rgba(5,8,22,0.95)_54%,rgba(15,23,42,0.86))] p-4 shadow-[0_18px_58px_rgba(0,0,0,0.26),0_0_26px_rgba(34,211,238,0.04)] sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/32 to-transparent" />
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.76fr)] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-200/85">
              FINANCE CALENDAR CENTER
            </p>
            <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-[2.2rem]">
              Calendar
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-300">
              Review daily income, expenses, transfers, and high-spending days across the selected month.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:self-start">
            {[
              {
                helper: `${monthNames[viewMonth]} ${viewYear}`,
                icon: Layers3,
                label: "Active Days",
                value: String(monthSummary.activeDays)
              },
              {
                helper: monthSummary.highestSpending
                  ? formatCurrency(monthSummary.highestSpending[1].expense)
                  : "No spending yet",
                icon: Flame,
                label: "Highest Spending Day",
                value: monthSummary.highestSpending
                  ? formatDisplayDate(monthSummary.highestSpending[0]).replace(`, ${viewYear}`, "")
                  : "None"
              },
              {
                helper: "Income minus expenses",
                icon: WalletCards,
                label: "Monthly Net",
                value: formatCurrency(monthSummary.net)
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="group rounded-2xl border border-cyan-400/12 bg-slate-950/52 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition hover:border-cyan-300/24 hover:bg-slate-950/66"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.06)] transition group-hover:border-cyan-300/28">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-black text-white">{item.value}</p>
                      <p className="truncate text-[11px] leading-4 text-muted">{item.helper}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          {
            helper: "Income this month",
            icon: ArrowDownLeft,
            label: "Monthly Income",
            value: formatCurrency(monthSummary.income),
            valueClass: "text-green-300"
          },
          {
            helper: "Expenses this month",
            icon: ArrowUpRight,
            label: "Monthly Expense",
            value: formatCurrency(monthSummary.expense),
            valueClass: "text-expense"
          },
          {
            helper: "Income minus expenses",
            icon: Sparkles,
            label: "Net Result",
            value: formatCurrency(monthSummary.net),
            valueClass: monthSummary.net >= 0 ? "text-cyan-100" : "text-expense"
          },
          {
            helper: "Days with activity",
            icon: CalendarDays,
            label: "Transaction Days",
            value: String(monthSummary.activeDays),
            valueClass: "text-cyan-100"
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.label}
              className="group relative overflow-hidden rounded-[1.2rem] border-cyan-400/10 bg-[linear-gradient(145deg,rgba(2,6,23,0.70),rgba(15,23,42,0.44))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {item.label}
                  </p>
                  <p className={cn("mt-1.5 truncate text-xl font-black tracking-tight", item.valueClass)}>
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">{item.helper}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.08)] transition group-hover:-translate-y-0.5 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/11">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="rounded-[1.55rem] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.06),transparent_32%),rgba(2,6,23,0.20)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
          <Card className="relative flex h-full flex-col overflow-visible rounded-[1.35rem] border-cyan-400/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.76),rgba(15,23,42,0.46))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_18px_54px_rgba(0,0,0,0.18)] sm:p-4">
          <CardHeader className="mb-3 flex-col gap-3 border-b border-cyan-400/8 pb-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-white">
                Monthly Activity
              </CardTitle>
              <CardDescription className="text-sm">
                Daily income, expense, transfer, and transaction signals.
              </CardDescription>
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-[16px] border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(5,12,26,0.86),rgba(2,6,23,0.82))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_34px_rgba(2,6,23,0.28),0_0_24px_rgba(34,211,238,0.035)]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveMonth(-1)}
                  disabled={!canMovePrevious}
                  aria-label="Previous month"
                  className="h-10 w-10 rounded-xl border border-cyan-300/10 bg-slate-950/34 text-cyan-100 hover:border-cyan-300/28 hover:bg-cyan-300/10 focus:ring-cyan-300/20"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setMonthPickerOpen((isOpen) => !isOpen)}
                  className="inline-flex h-10 min-w-[9.75rem] items-center justify-center gap-2 rounded-xl border border-cyan-300/18 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,6,23,0.88))] px-3 text-sm font-black tracking-tight text-white shadow-[0_0_20px_rgba(34,211,238,0.055)] transition hover:-translate-y-0.5 hover:border-cyan-300/42 hover:bg-slate-950/92 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/20 motion-reduce:hover:translate-y-0 sm:min-w-[10.25rem]"
                  aria-expanded={monthPickerOpen}
                  aria-haspopup="listbox"
                >
                  {monthNames[viewMonth]} {viewYear}
                  <ChevronDown
                    className={cn("h-4 w-4 text-cyan-200 transition", monthPickerOpen ? "rotate-180" : "")}
                    aria-hidden="true"
                  />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveMonth(1)}
                  disabled={!canMoveNext}
                  aria-label="Next month"
                  className="h-10 w-10 rounded-xl border border-cyan-300/10 bg-slate-950/34 text-cyan-100 hover:border-cyan-300/28 hover:bg-cyan-300/10 focus:ring-cyan-300/20"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              {monthPickerOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-cyan-300/18 bg-[linear-gradient(145deg,rgba(2,6,23,0.99),rgba(15,23,42,0.96))] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_32px_rgba(34,211,238,0.08)] backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-cyan-200/80">
                        Select Period
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {minimumYear} - {maximumYear}
                      </p>
                    </div>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={moveToCurrentMonth}
                      className="rounded-xl border border-cyan-300/14 bg-cyan-300/8 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/12 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                    >
                      Current month
                    </button>
                  </div>
                  <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                    {yearOptions.map((year) => (
                      <div key={year} className="rounded-2xl border border-slate-800/80 bg-slate-950/42 p-2">
                        <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          {year}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {monthNames.map((monthName, monthIndex) => {
                            const isActive = viewMonth === monthIndex && viewYear === year;

                            return (
                              <button
                                key={`${year}-${monthName}`}
                                type="button"
                                suppressHydrationWarning
                                onClick={() => selectMonth(monthIndex, year)}
                                className={cn(
                                  "flex items-center justify-between rounded-xl border px-2.5 py-2 text-left text-xs font-bold transition hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                                  isActive
                                    ? "border-cyan-300/45 bg-cyan-300/12 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.08)]"
                                    : "border-transparent bg-slate-900/36 text-slate-300 hover:border-cyan-300/20 hover:bg-slate-900/62 hover:text-white"
                                )}
                              >
                                <span>{monthName.slice(0, 3)}</span>
                                {isActive ? <Check className="h-3.5 w-3.5 text-cyan-200" aria-hidden="true" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardHeader>

          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {Array.from({ length: 35 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              {transactions.length === 0 ? (
                <div className="mb-3 flex flex-col gap-3 rounded-[1.15rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_38%),rgba(2,6,23,0.52)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/18 bg-cyan-300/9 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
                      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-black tracking-tight text-white">No calendar activity yet</p>
                      <p className="text-xs leading-5 text-muted">
                        The month is still visible. Add a transaction to activate daily finance insights.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/transactions"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-cyan-300/16 bg-cyan-300/8 px-3 text-xs font-bold text-cyan-100 transition hover:-translate-y-0.5 hover:border-cyan-300/34 hover:bg-cyan-300/12 motion-reduce:hover:translate-y-0"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add transaction
                  </Link>
                </div>
              ) : null}

              <div className="grid grid-cols-7 gap-2">
                {weekdayLabels.map((weekday) => (
                  <div
                    key={weekday}
                    className="rounded-xl border border-cyan-400/10 bg-slate-950/50 px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:px-2 sm:text-[10px]"
                  >
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid flex-1 grid-cols-7 gap-1.5 sm:gap-2">
                {calendarCells.map((cell, index) => {
                  if (!cell) {
                    return (
                      <div
                        key={`blank-${index}`}
                        className="min-h-[5.8rem] rounded-2xl border border-slate-900/55 bg-slate-950/10 sm:min-h-[7.15rem]"
                      />
                    );
                  }

                  const stats = dayMap.get(cell.date);
                  const hasIncome = Boolean(stats?.income);
                  const hasExpense = Boolean(stats?.expense);
                  const isExpenseHeavy = Boolean(stats && stats.expense >= stats.income && stats.expense > 0);
                  const isIncomeHeavy = Boolean(stats && stats.income > stats.expense && stats.income > 0);
                  const isSelected = selectedDate === cell.date;
                  const isToday = todayKey === cell.date;
                  const isHighSpending = highestSpendingDate === cell.date && Boolean(stats?.expense);

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setSelectedDate(cell.date)}
                      className={cn(
                        "group relative min-h-[5.8rem] overflow-hidden rounded-2xl border bg-slate-950/42 p-1.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-slate-950/66 hover:shadow-[0_14px_38px_rgba(34,211,238,0.07)] focus:outline-none focus:ring-2 focus:ring-cyan-300/24 motion-reduce:hover:translate-y-0 sm:min-h-[7.15rem] sm:p-2",
                        isSelected ? "border-cyan-300/75 bg-cyan-400/9 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_18px_46px_rgba(34,211,238,0.09)]" : "border-slate-800/82",
                        isHighSpending ? "ring-1 ring-expense/35" : "",
                        isToday ? "bg-cyan-400/8" : "",
                        isExpenseHeavy ? "before:absolute before:inset-y-3 before:left-0 before:w-px before:bg-expense/55" : "",
                        isIncomeHeavy ? "after:absolute after:inset-x-3 after:top-0 after:h-px after:bg-green-300/45" : "",
                        !stats ? "opacity-75 hover:opacity-100" : ""
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-xl text-sm font-black transition",
                              isSelected
                                ? "bg-cyan-300/16 text-cyan-50"
                                : isToday
                                  ? "bg-cyan-300/12 text-cyan-100"
                                  : "text-white"
                            )}
                          >
                            {cell.day}
                          </span>
                          {isToday ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
                          ) : null}
                        </span>
                        {stats ? (
                          <span className="rounded-full border border-cyan-400/18 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-100 sm:px-2 sm:text-[10px]">
                            {stats.count}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 space-y-1 sm:mt-3 sm:space-y-1.5">
                        {hasIncome ? (
                          <p className="truncate rounded-lg bg-green-300/5 px-1.5 py-1 text-[10px] font-bold text-green-300 sm:text-[11px]">
                            + {formatCurrency(stats?.income ?? 0)}
                          </p>
                        ) : null}
                        {hasExpense ? (
                          <p className="truncate rounded-lg bg-expense/5 px-1.5 py-1 text-[10px] font-bold text-expense sm:text-[11px]">
                            - {formatCurrency(stats?.expense ?? 0)}
                          </p>
                        ) : null}
                        {stats?.transfer ? (
                          <p className="truncate rounded-lg bg-cyan-300/5 px-1.5 py-1 text-[10px] font-bold text-cyan-200 sm:text-[11px]">
                            {formatCurrency(stats.transfer)} moved
                          </p>
                        ) : null}
                        {!stats && isSelected ? (
                          <p className="pt-1.5 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                            No activity
                          </p>
                        ) : !stats ? (
                          <div className="mt-5 h-px w-8 rounded-full bg-slate-800/80 sm:mt-8" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.76),rgba(15,23,42,0.48))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_18px_54px_rgba(0,0,0,0.18)]">
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
          <CardHeader className="mb-4 border-b border-cyan-400/8 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/85">
                Selected Day Insight
              </p>
              <CardTitle className="mt-2 text-xl font-black tracking-tight">
                {formatDisplayDate(selectedDate)}
              </CardTitle>
              <CardDescription>{selectedStats.count} transactions tracked</CardDescription>
            </div>
            <Badge tone={selectedStats.count > 0 ? "accent" : "slate"}>{selectedStats.count}</Badge>
          </CardHeader>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Daily Income", value: formatCurrency(selectedStats.income), className: "text-green-300" },
              { label: "Daily Expense", value: formatCurrency(selectedStats.expense), className: "text-expense" },
              {
                label: "Daily Net",
                value: formatCurrency(selectedStats.net),
                className: selectedStats.net >= 0 ? "text-cyan-100" : "text-expense"
              },
              { label: "Transfers", value: formatCurrency(selectedStats.transfer), className: "text-cyan-200" }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/48 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-slate-500">
                  {item.label}
                </p>
                <p className={cn("mt-1 truncate text-sm font-black tracking-tight sm:text-base", item.className)}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <Link
            href={`/transactions?date=${selectedDate}`}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-4 text-sm font-bold text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:shadow-[0_0_34px_rgba(34,211,238,0.18)] motion-reduce:hover:translate-y-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add transaction for this date
          </Link>

          <div className="mt-4 flex flex-1 flex-col space-y-2.5">
            {selectedStats.transactions.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_48%),rgba(2,6,23,0.52)] p-4 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/18 bg-cyan-300/8 text-cyan-200">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-2 text-sm font-black text-white">No transactions on this date</p>
                <p className="mx-auto mt-1 max-w-[18rem] text-xs leading-5 text-muted">
                  Choose a highlighted day or add a transaction to activate this insight panel.
                </p>
              </div>
            ) : (
              selectedStats.transactions.map((transaction) => {
                const tone = getTransactionTone(transaction.type as TransactionType);
                const Icon = tone.icon;
                const amount = Number(transaction.amount ?? 0);
                const category = getCategoryLabel(transaction);
                const account = getAccountLabel(transaction);

                return (
                  <div
                    key={transaction.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-950/48 p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/24 hover:bg-slate-950/64 motion-reduce:hover:translate-y-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/12 bg-cyan-300/8 text-cyan-200">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {transaction.note || category}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {category} - {account}
                          </p>
                        </div>
                      </div>
                      <Badge tone={tone.badgeTone}>{transaction.type}</Badge>
                    </div>
                    <p className={cn("mt-3 text-right text-sm font-black", tone.amountClass)}>
                      {tone.prefix}
                      {formatCurrency(amount)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
      </section>
    </div>
  );
}
