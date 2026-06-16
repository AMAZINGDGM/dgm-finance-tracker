"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Flag,
  Plus,
  Target,
  Trash2,
  Trophy,
  X
} from "lucide-react";
import { toast } from "sonner";

import { AppIcon } from "@/components/icons/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { formatCurrency } from "@/lib/finance/format";
import { requestJson } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types/entities";

type GoalFormState = {
  name: string;
  target_amount: string;
  current_amount: string;
  deadline: string;
  icon: string;
  color: string;
};

const emptyForm: GoalFormState = {
  name: "",
  target_amount: "",
  current_amount: "0",
  deadline: "",
  icon: "Target",
  color: "#38BDF8"
};

const goalIconOptions = [
  { label: "Target", value: "Target" },
  { label: "Emergency Fund", value: "ShieldAlert" },
  { label: "Laptop", value: "Laptop" },
  { label: "Travel", value: "Plane" },
  { label: "Business Capital", value: "Briefcase" },
  { label: "Education", value: "GraduationCap" },
  { label: "Home", value: "Home" },
  { label: "Car", value: "Car" },
  { label: "Savings", value: "PiggyBank" },
  { label: "Investment", value: "TrendingUp" }
];

const colorOptions = [
  "#38BDF8",
  "#22D3EE",
  "#6366F1",
  "#8B5CF6",
  "#22C55E",
  "#F43F5E",
  "#F59E0B",
  "#94A3B8"
];

const fieldLabelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/95";
const controlClass =
  "h-12 rounded-2xl border-cyan-400/15 bg-[#050816]/78 px-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_34px_rgba(0,0,0,0.18)] placeholder:text-slate-500/70 hover:border-cyan-300/28 hover:bg-slate-950/82 focus:border-cyan-300/55 focus:bg-[#050816]/90 focus:ring-accent-soft/20 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_16px_42px_rgba(0,0,0,0.24)]";

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

function getDaysUntilDeadline(deadline: string | null | undefined) {
  if (!deadline) {
    return null;
  }

  const today = new Date();
  const targetDate = new Date(deadline);

  return Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000);
}

function getStatusMeta(status: ReturnType<typeof getGoalStatus>) {
  if (status === "completed") {
    return {
      barClass: "bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400",
      borderClass: "border-emerald-300/22",
      label: "Completed",
      tone: "green" as const,
      valueClass: "text-green-300"
    };
  }

  if (status === "behind") {
    return {
      barClass: "bg-gradient-to-r from-rose-400 to-red-500",
      borderClass: "border-expense/25",
      label: "Behind",
      tone: "red" as const,
      valueClass: "text-expense"
    };
  }

  return {
    barClass: "bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500",
    borderClass: "border-cyan-300/18",
    label: "On track",
    tone: "accent" as const,
    valueClass: "text-cyan-100"
  };
}

function getGoalStatus(goal: Goal) {
  const target = Number(goal.target_amount ?? 0);
  const current = Number(goal.current_amount ?? 0);
  const progress = target > 0 ? (current / target) * 100 : 0;

  if (progress >= 100) {
    return "completed";
  }

  if (!goal.deadline) {
    return "on track";
  }

  const today = new Date();
  const deadline = new Date(goal.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);

  if (daysLeft < 0 || (daysLeft < 30 && progress < 75)) {
    return "behind";
  }

  return "on track";
}

export function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<GoalFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () =>
      goals.reduce(
        (summary, goal) => {
          summary.target += Number(goal.target_amount ?? 0);
          summary.current += Number(goal.current_amount ?? 0);
          return summary;
        },
        { target: 0, current: 0 }
      ),
    [goals]
  );

  async function loadGoals() {
    setLoading(true);
    try {
      const data = await requestJson<{ goals: Goal[] }>("/api/goals");
      setGoals(data.goals);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGoals();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount ?? 0),
      deadline: goal.deadline ?? "",
      icon: goal.icon ?? "Target",
      color: goal.color ?? "#38BDF8"
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      target_amount: amountToNumber(form.target_amount),
      current_amount: amountToNumber(form.current_amount),
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color
    };

    try {
      if (editingId) {
        await requestJson<{ goal: Goal }>(`/api/goals/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        toast.success("Goal updated.");
      } else {
        await requestJson<{ goal: Goal }>("/api/goals", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Goal added.");
      }

      resetForm();
      await loadGoals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save goal.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(goal: Goal) {
    const confirmed = window.confirm(`Delete ${goal.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await requestJson<{ ok: true }>(`/api/goals/${goal.id}`, { method: "DELETE" });
      toast.success("Goal deleted.");
      await loadGoals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete goal.");
    }
  }

  const overall = totals.target > 0 ? Math.min(100, (totals.current / totals.target) * 100) : 0;
  const completedCount = goals.filter((goal) => getGoalStatus(goal) === "completed").length;
  const behindCount = goals.filter((goal) => getGoalStatus(goal) === "behind").length;
  const activeCount = goals.length - completedCount;
  const nearestDeadline = goals
    .map((goal) => getDaysUntilDeadline(goal.deadline))
    .filter((days): days is number => days !== null)
    .sort((a, b) => a - b)[0];
  const deadlineStatus =
    nearestDeadline === undefined
      ? "No deadlines"
      : nearestDeadline < 0
        ? "Past due"
        : `${nearestDeadline} days`;
  const selectedIconOption =
    goalIconOptions.find((option) => option.value === form.icon) ?? goalIconOptions[0];

  return (
    <div className="space-y-3 pb-16">
      <section className="relative overflow-hidden rounded-[1.18rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),linear-gradient(135deg,rgba(3,7,18,0.98),rgba(5,8,22,0.94)_54%,rgba(15,23,42,0.88))] p-3 shadow-[0_12px_44px_rgba(0,0,0,0.22),0_0_22px_rgba(34,211,238,0.03)] sm:p-3.5">
        <div className="pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
        <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.95fr)] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-200/85">
              GOAL COMMAND CENTER
            </p>
            <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-[2.25rem]">
              Goals
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-300">
              Plan financial targets, monitor savings progress, and keep every milestone moving with precision.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:self-start">
            {[
              {
                helper: `${completedCount} completed`,
                icon: Flag,
                label: "Active Goals",
                value: String(activeCount)
              },
              {
                helper: `${Math.round(overall)}% funded`,
                icon: CheckCircle2,
                label: "Target Health",
                value: behindCount > 0 ? `${behindCount} behind` : "On track"
              },
              {
                helper: "Nearest target date",
                icon: CalendarClock,
                label: "Deadline Status",
                value: deadlineStatus
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
            helper: "Current saved amount",
            icon: CircleDollarSign,
            label: "Saved Toward Goals",
            value: formatCurrency(totals.current),
            valueClass: "text-green-300"
          },
          {
            helper: "Combined financial targets",
            icon: Target,
            label: "Target Total",
            value: formatCurrency(totals.target),
            valueClass: "text-white"
          },
          {
            helper: `${activeCount} active targets`,
            icon: Trophy,
            label: "Overall Progress",
            value: `${Math.round(overall)}%`,
            valueClass: "text-cyan-100"
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
          id="goal-setup"
          className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-slate-950/48 p-5"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
          <CardHeader className="relative mb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200/85">
                GOAL SETUP
              </p>
              <CardTitle className="mt-2 text-xl font-black tracking-tight">
                {editingId ? "Edit Goal Plan" : "Create Goal Plan"}
              </CardTitle>
              <CardDescription>
                Build a savings target with a deadline, identity, and live progress signal.
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
              <span className={fieldLabelClass}>Goal name</span>
              <Input
                className={controlClass}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Emergency fund"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>Target amount</span>
                <Input
                  className={controlClass}
                  inputMode="numeric"
                  min="1"
                  value={formatAmountInput(form.target_amount)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      target_amount: sanitizeAmountInput(event.target.value)
                    }))
                  }
                  placeholder="10.000.000"
                  required
                />
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Current amount</span>
                <Input
                  className={controlClass}
                  inputMode="numeric"
                  min="0"
                  value={formatAmountInput(form.current_amount)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      current_amount: sanitizeAmountInput(event.target.value)
                    }))
                  }
                  placeholder="0"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>Deadline</span>
                <Input
                  className={controlClass}
                  type="date"
                  value={form.deadline}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, deadline: event.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Icon</span>
                <div className="relative">
                  <button
                    type="button"
                    suppressHydrationWarning
                    className={cn(
                      controlClass,
                      "flex w-full items-center justify-between gap-3 text-left"
                    )}
                    onClick={() => setIconMenuOpen((open) => !open)}
                    aria-expanded={iconMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                        <AppIcon name={selectedIconOption.value} className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-100">
                        {selectedIconOption.label}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-cyan-200/70 transition",
                        iconMenuOpen ? "rotate-180" : ""
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {iconMenuOpen ? (
                    <div
                      className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-auto rounded-2xl border border-cyan-400/18 bg-[#050816]/98 p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.45),0_0_28px_rgba(34,211,238,0.08)] backdrop-blur-xl"
                      role="listbox"
                    >
                      {goalIconOptions.map((option) => {
                        const selected = option.value === form.icon;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            suppressHydrationWarning
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-cyan-400/10 hover:text-white",
                              selected ? "bg-cyan-400/12 text-cyan-100" : "text-slate-300"
                            )}
                            onClick={() => {
                              setForm((current) => ({ ...current, icon: option.value }));
                              setIconMenuOpen(false);
                            }}
                            role="option"
                            aria-selected={selected}
                          >
                            <span className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/12 bg-slate-950/70 text-cyan-200">
                              <AppIcon name={option.value} className="h-4 w-4" />
                            </span>
                            <span className="font-semibold">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            <label className="block">
              <span className={fieldLabelClass}>Color identity</span>
              <div className="space-y-3 rounded-2xl border border-cyan-400/12 bg-slate-950/35 p-3">
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const selected = form.color.toLowerCase() === color.toLowerCase();

                    return (
                      <button
                        key={color}
                        type="button"
                        suppressHydrationWarning
                        className={cn(
                          "h-8 w-8 rounded-full border transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(34,211,238,0.14)]",
                          selected
                            ? "border-white shadow-[0_0_0_3px_rgba(34,211,238,0.18),0_0_24px_rgba(34,211,238,0.18)]"
                            : "border-white/15"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm((current) => ({ ...current, color }))}
                        aria-label={`Use ${color} as goal color`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                  <div
                    className="rounded-2xl border border-cyan-400/15 bg-[#050816]/78 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
                    style={{ boxShadow: `0 0 28px ${form.color}22, inset 0 1px 0 rgba(255,255,255,0.035)` }}
                  >
                    <div
                      className="h-full rounded-xl"
                      style={{ backgroundColor: form.color }}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Selected color preview</span>
                  </div>
                  <Input
                    className={controlClass}
                    value={form.color}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, color: event.target.value }))
                    }
                    placeholder="#38BDF8"
                    aria-label="Goal color hex value"
                  />
                </div>
              </div>
            </label>

            <Button className="w-full rounded-2xl" type="submit" disabled={saving}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : editingId ? "Update goal plan" : "Create goal plan"}
            </Button>
          </form>
        </Card>

        <Card className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-slate-950/44 p-5">
          <CardHeader className="mb-5">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Goals</CardTitle>
              <CardDescription>{goals.length} active savings targets</CardDescription>
            </div>
            <Badge tone="accent">IDR</Badge>
          </CardHeader>

          {loading ? (
            <div className="space-y-3">
              <LoadingSkeleton className="h-28 rounded-3xl" />
              <LoadingSkeleton className="h-28 rounded-3xl" />
              <LoadingSkeleton className="h-28 rounded-3xl" />
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-[1.2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_42%),rgba(2,6,23,0.58)] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-7">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_36px_rgba(34,211,238,0.12)]">
                <Target className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-3 text-lg font-black tracking-tight text-white">No goals yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted">
                Create your first financial target to track savings progress.
              </p>
              <Button
                className="mt-4 rounded-2xl"
                type="button"
                onClick={() => {
                  resetForm();
                  document.getElementById("goal-setup")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create first goal
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {goals.map((goal) => {
                const current = Number(goal.current_amount ?? 0);
                const target = Number(goal.target_amount ?? 0);
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                const status = getGoalStatus(goal);
                const statusMeta = getStatusMeta(status);
                const daysLeft = getDaysUntilDeadline(goal.deadline);

                return (
                  <article
                    key={goal.id}
                    className={cn(
                      "group rounded-[1.15rem] border bg-slate-950/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/28 hover:bg-slate-950/66 hover:shadow-[0_16px_46px_rgba(34,211,238,0.08)] motion-reduce:hover:translate-y-0",
                      statusMeta.borderClass,
                      status === "completed" ? "bg-emerald-950/18" : ""
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 text-cyan-100 shadow-[0_0_26px_rgba(34,211,238,0.08)]"
                          style={{ backgroundColor: `${goal.color ?? "#38BDF8"}24` }}
                        >
                          <AppIcon name={goal.icon ?? "Target"} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-black tracking-tight text-white">
                              {goal.name}
                            </h3>
                            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            {goal.deadline
                              ? `${goal.deadline}${daysLeft !== null ? ` - ${daysLeft < 0 ? "past due" : `${daysLeft} days left`}` : ""}`
                              : "No deadline"}
                          </p>
                        </div>
                      </div>
                      <p className={cn("text-right text-2xl font-black tracking-tight", statusMeta.valueClass)}>
                        {Math.round(progress)}%
                      </p>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/90 ring-1 ring-slate-800/80">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", statusMeta.barClass)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800/75 bg-slate-950/42 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Current
                        </p>
                        <p className="mt-1 font-bold text-green-300">{formatCurrency(current)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800/75 bg-slate-950/42 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Target
                        </p>
                        <p className="mt-1 font-bold text-white">{formatCurrency(target)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => startEdit(goal)}>
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        className="border-red-400/20 bg-red-500/5 text-red-200/80 hover:border-red-400/45 hover:bg-red-500/15 hover:text-red-100"
                        variant="danger"
                        size="sm"
                        onClick={() => void deleteGoal(goal)}
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
