"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Gauge,
  Layers3,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Select } from "@/components/ui/select";
import { formatCurrency, getCurrentMonthYear, monthNames } from "@/lib/finance/format";
import { requestJson } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Budget, Category, Transaction } from "@/types/entities";

type BudgetFormState = {
  category_id: string;
  month: string;
  year: string;
  limit_amount: string;
};

const current = getCurrentMonthYear();

const emptyForm: BudgetFormState = {
  category_id: "",
  month: String(current.month),
  year: String(current.year),
  limit_amount: ""
};

const fieldLabelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/95";
const controlClass =
  "h-12 rounded-2xl border-cyan-400/15 bg-[#050816]/78 px-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_34px_rgba(0,0,0,0.18)] placeholder:text-slate-500/70 hover:border-cyan-300/28 hover:bg-slate-950/82 focus:border-cyan-300/55 focus:bg-[#050816]/90 focus:ring-accent-soft/20 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_16px_42px_rgba(0,0,0,0.24)]";
const selectControlClass = `${controlClass} cursor-pointer appearance-none pr-10`;
const compactControlClass =
  "h-11 rounded-2xl border-cyan-400/12 bg-slate-950/62 px-3 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] hover:border-cyan-300/28 focus:border-cyan-300/55 focus:ring-accent-soft/20";

function sanitizeAmountInput(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function formatAmountInput(value: string) {
  const digits = sanitizeAmountInput(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function amountToNumber(value: string) {
  return Number(sanitizeAmountInput(value) || "0");
}

function getBudgetState(percent: number) {
  if (percent >= 100) {
    return {
      label: "Over budget",
      tone: "red" as const,
      valueClass: "text-expense",
      barClass: "bg-expense",
      iconClass: "text-expense"
    };
  }

  if (percent >= 75) {
    return {
      label: "Warning",
      tone: "warning" as const,
      valueClass: "text-warning",
      barClass: "bg-warning",
      iconClass: "text-warning"
    };
  }

  return {
    label: "Healthy",
    tone: "green" as const,
    valueClass: "text-cyan-100",
    barClass: "bg-gradient-to-r from-cyan-400 to-emerald-400",
    iconClass: "text-cyan-200"
  };
}

function SelectChevron() {
  return (
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/70"
      aria-hidden="true"
    />
  );
}

export function BudgetsManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<BudgetFormState>(emptyForm);
  const [selectedMonth, setSelectedMonth] = useState(String(current.month));
  const [selectedYear, setSelectedYear] = useState(String(current.year));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const visibleBudgets = useMemo(
    () =>
      budgets.filter(
        (budget) => budget.month === Number(selectedMonth) && budget.year === Number(selectedYear)
      ),
    [budgets, selectedMonth, selectedYear]
  );

  const usedByCategory = useMemo(() => {
    const map = new Map<string, number>();

    for (const transaction of transactions) {
      if (
        transaction.type !== "expense" ||
        !transaction.category_id ||
        !transaction.date.startsWith(`${selectedYear}-${selectedMonth.padStart(2, "0")}`)
      ) {
        continue;
      }

      map.set(
        transaction.category_id,
        (map.get(transaction.category_id) ?? 0) + Number(transaction.amount ?? 0)
      );
    }

    return map;
  }, [selectedMonth, selectedYear, transactions]);

  const totals = useMemo(() => {
    return visibleBudgets.reduce(
      (summary, budget) => {
        const used = usedByCategory.get(budget.category_id) ?? 0;
        summary.limit += Number(budget.limit_amount ?? 0);
        summary.used += used;
        return summary;
      },
      { limit: 0, used: 0 }
    );
  }, [usedByCategory, visibleBudgets]);

  const riskCounts = useMemo(() => {
    return visibleBudgets.reduce(
      (summary, budget) => {
        const used = usedByCategory.get(budget.category_id) ?? 0;
        const limit = Number(budget.limit_amount ?? 0);
        const percent = limit > 0 ? (used / limit) * 100 : 0;

        if (percent >= 100) {
          summary.over += 1;
        } else if (percent >= 75) {
          summary.warning += 1;
        }

        return summary;
      },
      { over: 0, warning: 0 }
    );
  }, [usedByCategory, visibleBudgets]);

  async function loadData() {
    setLoading(true);
    try {
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        requestJson<{ budgets: Budget[] }>("/api/budgets"),
        requestJson<{ categories: Category[] }>("/api/categories"),
        requestJson<{ transactions: Transaction[] }>("/api/transactions")
      ]);

      setBudgets(budgetsData.budgets);
      setCategories(categoriesData.categories);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load budgets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setForm({
      ...emptyForm,
      month: selectedMonth,
      year: selectedYear
    });
    setEditingId(null);
  }

  function startEdit(budget: Budget) {
    setEditingId(budget.id);
    setForm({
      category_id: budget.category_id,
      month: String(budget.month),
      year: String(budget.year),
      limit_amount: String(budget.limit_amount)
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      category_id: form.category_id,
      month: Number(form.month),
      year: Number(form.year),
      limit_amount: amountToNumber(form.limit_amount)
    };

    try {
      if (editingId) {
        await requestJson<{ budget: Budget }>(`/api/budgets/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        toast.success("Budget updated.");
      } else {
        await requestJson<{ budget: Budget }>("/api/budgets", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Budget added.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(budget: Budget) {
    const category = categoryMap.get(budget.category_id)?.name ?? "this budget";
    const confirmed = window.confirm(`Delete ${category} budget?`);

    if (!confirmed) {
      return;
    }

    try {
      await requestJson<{ ok: true }>(`/api/budgets/${budget.id}`, { method: "DELETE" });
      toast.success("Budget deleted.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete budget.");
    }
  }

  const overallPercent = totals.limit > 0 ? Math.min(999, (totals.used / totals.limit) * 100) : 0;
  const remaining = Math.max(0, totals.limit - totals.used);
  const overallState = getBudgetState(overallPercent);
  const usedValueClass =
    overallPercent >= 100 ? "text-expense" : overallPercent >= 75 ? "text-warning" : "text-cyan-100";
  const warningLevel =
    riskCounts.over > 0
      ? `${riskCounts.over} over`
      : riskCounts.warning > 0
        ? `${riskCounts.warning} warning`
        : "Clear";

  return (
    <div className="space-y-3 pb-16">
      <section className="relative overflow-hidden rounded-[1.18rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),linear-gradient(135deg,rgba(3,7,18,0.98),rgba(5,8,22,0.94)_54%,rgba(15,23,42,0.88))] p-3 shadow-[0_12px_44px_rgba(0,0,0,0.22),0_0_22px_rgba(34,211,238,0.03)] sm:p-3.5">
        <div className="pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
        <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.95fr)] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-200/85">
              BUDGET CONTROL CENTER
            </p>
            <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-[2.25rem]">
              Budgets
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-300">
              Control category limits, detect overspending early, and keep monthly spending disciplined.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:self-start">
            {[
              {
                icon: Layers3,
                label: "Active Budgets",
                value: String(visibleBudgets.length),
                helper: `${monthNames[Number(selectedMonth) - 1]} ${selectedYear}`
              },
              {
                icon: ShieldCheck,
                label: "Budget Health",
                value: loading ? "--" : overallState.label,
                helper: `${Math.round(overallPercent)}% used`
              },
              {
                icon: AlertTriangle,
                label: "Warning Level",
                value: warningLevel,
                helper: "75% warning, 100% danger"
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-cyan-400/12 bg-slate-950/52 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-white">{item.value}</p>
                      <p className="truncate text-[11px] text-muted">{item.helper}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            helper: "Planned category limit",
            icon: Target,
            label: "Budget Limit",
            value: formatCurrency(totals.limit),
            valueClass: "text-white"
          },
          {
            helper: `${Math.round(overallPercent)}% of total limit`,
            icon: CircleDollarSign,
            label: "Used",
            value: formatCurrency(totals.used),
            valueClass: usedValueClass
          },
          {
            helper: remaining > 0 ? "Safe balance remaining" : "No room left this month",
            icon: CheckCircle2,
            label: "Remaining",
            value: formatCurrency(remaining),
            valueClass: remaining > 0 ? "text-green-300" : "text-expense"
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.label}
              className="relative overflow-hidden rounded-[1.15rem] border-cyan-400/10 bg-slate-950/48 p-4"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {item.label}
                  </p>
                  <p className={cn("mt-2 text-2xl font-black tracking-tight", item.valueClass)}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted">{item.helper}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.08)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-3 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card
          id="budget-setup"
          className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-slate-950/48 p-5"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
          <CardHeader className="relative mb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200/85">
                BUDGET SETUP
              </p>
              <CardTitle className="mt-2 text-xl font-black tracking-tight">
                {editingId ? "Edit Budget Plan" : "Create Budget Plan"}
              </CardTitle>
              <CardDescription>
                Set monthly spending limits and receive early warning signals.
              </CardDescription>
            </div>
            {editingId ? (
              <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Cancel edit">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            ) : null}
          </CardHeader>

          <form className="relative space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={fieldLabelClass}>Expense category</span>
              <div className="relative">
                <Select
                  className={selectControlClass}
                  value={form.category_id}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, category_id: event.target.value }))
                  }
                  required
                >
                  <option value="">Choose category</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <SelectChevron />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>Month</span>
                <div className="relative">
                  <Select
                    className={selectControlClass}
                    value={form.month}
                    onChange={(event) =>
                      setForm((currentForm) => ({ ...currentForm, month: event.target.value }))
                    }
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </Select>
                  <SelectChevron />
                </div>
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Year</span>
                <Input
                  className={controlClass}
                  type="number"
                  min="2000"
                  value={form.year}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, year: event.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className={fieldLabelClass}>Limit amount</span>
              <Input
                className={controlClass}
                inputMode="numeric"
                min="1"
                value={formatAmountInput(form.limit_amount)}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    limit_amount: sanitizeAmountInput(event.target.value)
                  }))
                }
                placeholder="1.000.000"
                required
              />
              <p className="mt-2 text-xs text-muted">Warning starts at 75%. Danger starts at 100%.</p>
            </label>

            <Button className="w-full rounded-2xl" type="submit" disabled={saving}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : editingId ? "Update budget plan" : "Create budget plan"}
            </Button>
          </form>
        </Card>

        <Card className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-slate-950/44 p-5">
          <CardHeader className="mb-5 flex-col gap-4 lg:flex-row lg:items-start">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Monthly Budgets</CardTitle>
              <CardDescription>
                Track category limits, used amount, remaining balance, and risk level.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative min-w-0 sm:min-w-[190px]">
                <Select
                  className={cn(selectControlClass, compactControlClass)}
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </Select>
                <SelectChevron />
              </div>
              <Input
                className={cn(compactControlClass, "sm:w-[112px]")}
                type="number"
                min="2000"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              />
            </div>
          </CardHeader>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge tone={overallState.tone}>{overallState.label}</Badge>
            <Badge tone="blue">{visibleBudgets.length} budgets</Badge>
            <Badge tone={riskCounts.over > 0 ? "red" : riskCounts.warning > 0 ? "warning" : "slate"}>
              {warningLevel}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              <LoadingSkeleton className="h-28 rounded-3xl" />
              <LoadingSkeleton className="h-28 rounded-3xl" />
              <LoadingSkeleton className="h-28 rounded-3xl" />
            </div>
          ) : visibleBudgets.length === 0 ? (
            <div className="rounded-[1.2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_42%),rgba(2,6,23,0.58)] p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_36px_rgba(34,211,238,0.12)]">
                <Gauge className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="mt-4 text-lg font-black tracking-tight text-white">No budget plan yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Create your first monthly budget to unlock spending protection.
              </p>
              <Button
                className="mt-5 rounded-2xl"
                type="button"
                onClick={() => {
                  resetForm();
                  document.getElementById("budget-setup")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create first budget
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {visibleBudgets.map((budget) => {
                const category = categoryMap.get(budget.category_id);
                const used = usedByCategory.get(budget.category_id) ?? 0;
                const limit = Number(budget.limit_amount ?? 0);
                const percent = limit > 0 ? Math.min(999, (used / limit) * 100) : 0;
                const remainingBudget = Math.max(0, limit - used);
                const state = getBudgetState(percent);

                return (
                  <article
                    key={budget.id}
                    className="group rounded-[1.15rem] border border-slate-800/85 bg-slate-950/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/28 hover:bg-slate-950/66 hover:shadow-[0_16px_46px_rgba(34,211,238,0.08)] motion-reduce:hover:translate-y-0"
                    style={{
                      borderColor: category?.color ? `${category.color}33` : undefined
                    }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]"
                            style={{ backgroundColor: category?.color ?? "#38BDF8" }}
                          />
                          <h3 className="text-base font-black tracking-tight text-white">
                            {category?.name ?? "Deleted category"}
                          </h3>
                          <Badge tone={state.tone}>{state.label}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted">
                          Limit {formatCurrency(limit)} - Used {formatCurrency(used)} - Remaining{" "}
                          {formatCurrency(remainingBudget)}
                        </p>
                      </div>
                      <p className={cn("text-right text-2xl font-black tracking-tight", state.valueClass)}>
                        {Math.round(percent)}%
                      </p>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/90 ring-1 ring-slate-800/80">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", state.barClass)}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-800/75 bg-slate-950/42 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Limit
                        </p>
                        <p className="mt-1 font-bold text-white">{formatCurrency(limit)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800/75 bg-slate-950/42 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Used
                        </p>
                        <p className={cn("mt-1 font-bold", state.valueClass)}>{formatCurrency(used)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800/75 bg-slate-950/42 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Remaining
                        </p>
                        <p className="mt-1 font-bold text-green-300">{formatCurrency(remainingBudget)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => startEdit(budget)}>
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        className="border-red-400/20 bg-red-500/5 text-red-200/80 hover:border-red-400/45 hover:bg-red-500/15 hover:text-red-100"
                        variant="danger"
                        size="sm"
                        onClick={() => void deleteBudget(budget)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
