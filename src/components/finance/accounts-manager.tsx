"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Edit3, Plus, Scale, Trash2, WalletCards, X } from "lucide-react";
import { toast } from "sonner";

import { AppIcon } from "@/components/icons/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/finance/format";
import { requestJson, todayInputValue } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/entities";
import type { AccountType } from "@/types/finance";

type AccountFormState = {
  name: string;
  type: AccountType;
  initial_balance: string;
  current_balance: string;
  color: string;
  icon: string;
};

type AccountTypeMeta = {
  color: string;
  description: string;
  icon: string;
  label: string;
};

const accountTypeMeta: Record<AccountType, AccountTypeMeta> = {
  cash: {
    color: "#38BDF8",
    description: "Physical money and daily cash.",
    icon: "Wallet",
    label: "Cash"
  },
  bank: {
    color: "#6366F1",
    description: "Bank accounts and debit balances.",
    icon: "Landmark",
    label: "Bank"
  },
  "e-wallet": {
    color: "#22D3EE",
    description: "GoPay, OVO, Dana, and wallets.",
    icon: "Smartphone",
    label: "E-wallet"
  },
  savings: {
    color: "#22C55E",
    description: "Savings funds and reserves.",
    icon: "PiggyBank",
    label: "Savings"
  },
  business: {
    color: "#8B5CF6",
    description: "Business and project money.",
    icon: "Briefcase",
    label: "Business"
  },
  investment: {
    color: "#38BDF8",
    description: "Investments and growth assets.",
    icon: "TrendingUp",
    label: "Investment"
  },
  other: {
    color: "#94A3B8",
    description: "Any custom balance source.",
    icon: "WalletCards",
    label: "Other"
  }
};

const emptyForm: AccountFormState = {
  name: "",
  type: "cash",
  initial_balance: "0",
  current_balance: "0",
  color: accountTypeMeta.cash.color,
  icon: accountTypeMeta.cash.icon
};

const accountTypeOptions = Object.keys(accountTypeMeta) as AccountType[];
const iconOptions = [
  "Wallet",
  "Landmark",
  "Smartphone",
  "PiggyBank",
  "Briefcase",
  "TrendingUp",
  "WalletCards"
];
const colorOptions = ["#38BDF8", "#22D3EE", "#6366F1", "#8B5CF6", "#22C55E", "#64748B"];
const fieldLabelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400/95";
const controlClass =
  "h-12 rounded-2xl border-cyan-400/15 bg-[#050816]/78 px-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_34px_rgba(0,0,0,0.18)] placeholder:text-slate-500/70 hover:border-cyan-300/28 hover:bg-slate-950/82 focus:border-cyan-300/55 focus:bg-[#050816]/90 focus:ring-accent-soft/20 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_16px_42px_rgba(0,0,0,0.24)]";
const selectControlClass = `${controlClass} cursor-pointer pr-9`;

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

function colorToRgba(value: string | null | undefined, alpha: number) {
  const color = value && /^#[0-9A-F]{6}$/i.test(value) ? value : "#38BDF8";
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getAccountMeta(type: string | null | undefined) {
  return accountTypeMeta[(type as AccountType) || "cash"] ?? accountTypeMeta.other;
}

function getAccountAccent(account: Account) {
  return account.color || getAccountMeta(account.type).color;
}

function SummaryCard({
  helper,
  icon,
  title,
  value
}: {
  helper: string;
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <Card className="dashboard-stat-card relative overflow-hidden p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 truncate text-lg font-black tracking-tight text-white sm:text-xl">
            {value}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{helper}</p>
        </div>
        <div className="rounded-xl border border-accent/20 bg-sky/10 p-2.5 text-accent-soft">
          <AppIcon name={icon} className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

export function AccountsManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reconcileAccount, setReconcileAccount] = useState<Account | null>(null);
  const [reconcileBalance, setReconcileBalance] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const totalBalance = useMemo(
    () => accounts.reduce((total, account) => total + Number(account.current_balance ?? 0), 0),
    [accounts]
  );
  const bankWalletCount = useMemo(
    () => accounts.filter((account) => account.type === "bank" || account.type === "e-wallet").length,
    [accounts]
  );
  const highestBalanceAccount = useMemo(() => {
    return accounts.reduce<Account | null>((highest, account) => {
      if (!highest) {
        return account;
      }

      return Number(account.current_balance ?? 0) > Number(highest.current_balance ?? 0)
        ? account
        : highest;
    }, null);
  }, [accounts]);
  const mostRecentlyUpdated = useMemo(() => {
    return accounts.reduce<Account | null>((latest, account) => {
      if (!latest) {
        return account;
      }

      return String(account.updated_at ?? "") > String(latest.updated_at ?? "") ? account : latest;
    }, null);
  }, [accounts]);
  const hasBalanceMovement = accounts.some((account) => Number(account.current_balance ?? 0) > 0);
  const typeCount = new Set(accounts.map((account) => account.type)).size;

  async function loadAccounts() {
    setLoading(true);
    try {
      const data = await requestJson<{ accounts: Account[] }>("/api/accounts");
      setAccounts(data.accounts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(account: Account) {
    const meta = getAccountMeta(account.type);
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type as AccountType,
      initial_balance: sanitizeAmountInput(String(account.initial_balance ?? 0)),
      current_balance: sanitizeAmountInput(String(account.current_balance ?? 0)),
      color: account.color ?? meta.color,
      icon: account.icon ?? meta.icon
    });
    document.getElementById("account-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function moveToAccountForm() {
    resetForm();
    document.getElementById("account-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function openReconcile(account: Account) {
    setReconcileAccount(account);
    setReconcileBalance(sanitizeAmountInput(String(account.current_balance ?? 0)));
    setReconcileNote("");
  }

  async function handleReconcile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reconcileAccount) {
      return;
    }

    setReconciling(true);
    try {
      const result = await requestJson<{ adjusted: boolean; difference: number }>(
        "/api/accounts/reconcile",
        {
          method: "POST",
          body: JSON.stringify({
            account_id: reconcileAccount.id,
            real_balance: amountToNumber(reconcileBalance),
            date: todayInputValue(),
            note: reconcileNote.trim() || null
          })
        }
      );

      toast.success(
        result.adjusted
          ? `Balance adjusted by ${formatCurrency(Math.abs(result.difference))}.`
          : "Account already matches the real balance."
      );
      setReconcileAccount(null);
      await loadAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reconcile account.");
    } finally {
      setReconciling(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      initial_balance: amountToNumber(form.initial_balance),
      current_balance: amountToNumber(form.current_balance)
    };

    try {
      if (editingId) {
        await requestJson<{ account: Account }>(`/api/accounts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        toast.success("Account updated successfully.");
      } else {
        await requestJson<{ account: Account }>("/api/accounts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Account added successfully.");
      }

      resetForm();
      await loadAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save account.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(account: Account) {
    const confirmed = window.confirm(`Delete ${account.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await requestJson<{ ok: true }>(`/api/accounts/${account.id}`, {
        method: "DELETE"
      });
      toast.success("Account deleted.");
      await loadAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account.");
    }
  }

  return (
    <>
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          value={hasBalanceMovement ? formatCurrency(totalBalance) : "No balance yet"}
          helper={
            hasBalanceMovement
              ? "Across all tracked accounts"
              : "Add transactions to activate live account insights."
          }
          icon="WalletCards"
        />
        <SummaryCard
          title="Tracked Accounts"
          value={String(accounts.length)}
          helper={accounts.length === 1 ? "One balance source" : "Balance sources connected"}
          icon="Wallet"
        />
        <SummaryCard
          title="Bank & E-wallets"
          value={String(bankWalletCount)}
          helper="Bank and digital wallet accounts"
          icon="Smartphone"
        />
        <SummaryCard
          title="Highest Balance"
          value={
            highestBalanceAccount && Number(highestBalanceAccount.current_balance ?? 0) > 0
              ? highestBalanceAccount.name
              : "No balance yet"
          }
          helper={
            highestBalanceAccount && Number(highestBalanceAccount.current_balance ?? 0) > 0
              ? formatCurrency(Number(highestBalanceAccount.current_balance ?? 0))
              : "Insights will appear after your first transactions."
          }
          icon="TrendingUp"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <Card
          id="account-form"
          className="dashboard-chart-card overflow-hidden xl:sticky xl:top-28 xl:self-start"
        >
          <CardHeader className="mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
                Account Setup
              </p>
              <CardTitle className="mt-2 text-xl font-black tracking-tight">
                {editingId ? "Edit Account" : "Add Account"}
              </CardTitle>
              <CardDescription className="leading-6">
                Balances are stored in IDR and updated by transaction triggers.
              </CardDescription>
            </div>
            {editingId ? (
              <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Cancel edit">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            ) : null}
          </CardHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={fieldLabelClass}>Account name</span>
              <Input
                className={controlClass}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Shopee Seller Balance, SeaBank Davenue, Davenue ShopeePay..."
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>Type</span>
                <Select
                  className={selectControlClass}
                  value={form.type}
                  onChange={(event) => {
                    const type = event.target.value as AccountType;
                    const meta = accountTypeMeta[type];
                    setForm((current) => ({
                      ...current,
                      type,
                      color: meta.color,
                      icon: meta.icon
                    }));
                  }}
                >
                  {accountTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {accountTypeMeta[type].label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Icon</span>
                <Select
                  className={selectControlClass}
                  value={form.icon}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, icon: event.target.value }))
                  }
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>Initial balance</span>
                <Input
                  className={controlClass}
                  inputMode="numeric"
                  value={formatAmountInput(form.initial_balance)}
                  onChange={(event) => {
                    const value = sanitizeAmountInput(event.target.value);
                    setForm((current) => ({
                      ...current,
                      initial_balance: value,
                      current_balance: editingId ? current.current_balance : value
                    }));
                  }}
                  placeholder="2.500.000"
                />
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Current balance</span>
                <Input
                  className={controlClass}
                  inputMode="numeric"
                  value={formatAmountInput(form.current_balance)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      current_balance: sanitizeAmountInput(event.target.value)
                    }))
                  }
                  placeholder="10.000.000"
                />
              </label>
            </div>

            <label className="block">
              <span className={fieldLabelClass}>Color identity</span>
              <div className="rounded-[1.25rem] border border-cyan-400/15 bg-[#050816]/64 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="mb-3 flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const active = form.color.toLowerCase() === color.toLowerCase();

                    return (
                      <button
                        key={color}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setForm((current) => ({ ...current, color }))}
                        className={cn(
                          "h-8 w-8 rounded-full border transition hover:-translate-y-0.5",
                          active ? "border-white shadow-glow" : "border-white/15"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Use ${color} account color`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, color: event.target.value }))
                    }
                    className="h-12 rounded-2xl border-cyan-400/15 bg-slate-950/78 p-1"
                    aria-label="Account color"
                  />
                  <Input
                    className={controlClass}
                    value={form.color}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, color: event.target.value }))
                    }
                  />
                </div>
              </div>
            </label>

            <Button className="h-12 w-full rounded-2xl" type="submit" disabled={saving}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : editingId ? "Update account" : "Add account"}
            </Button>
          </form>
        </Card>

        <Card className="dashboard-chart-card overflow-hidden">
          <CardHeader className="mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
                Account Hub
              </p>
              <CardTitle className="mt-2 text-xl font-black tracking-tight">Accounts</CardTitle>
              <CardDescription>
                Net tracked balance: {formatCurrency(totalBalance)}
              </CardDescription>
            </div>
            <Badge tone="accent">{accounts.length} accounts</Badge>
          </CardHeader>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/28 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Type mix
              </p>
              <p className="mt-2 text-sm font-bold text-white">{typeCount} types tracked</p>
            </div>
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/28 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Latest update
              </p>
              <p className="mt-2 truncate text-sm font-bold text-white">
                {mostRecentlyUpdated?.name ?? "No account yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/28 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Insight status
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                {hasBalanceMovement ? "Live insights active" : "Awaiting movement"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <LoadingSkeleton className="h-44" />
              <LoadingSkeleton className="h-44" />
              <LoadingSkeleton className="h-44" />
              <LoadingSkeleton className="h-44" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/25 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-soft">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 font-bold text-white">No accounts yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Create your first cash, bank, or e-wallet account to start tracking your money.
              </p>
              <Button className="mt-5" size="sm" type="button" onClick={moveToAccountForm}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add account
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {accounts.map((account) => {
                const meta = getAccountMeta(account.type);
                const accent = getAccountAccent(account);
                const currentBalance = Number(account.current_balance ?? 0);
                const initialBalance = Number(account.initial_balance ?? 0);
                const movement = currentBalance - initialBalance;
                const cardStyle = {
                  borderColor: colorToRgba(accent, 0.22),
                  boxShadow: `0 16px 48px rgba(0,0,0,0.24), 0 0 34px ${colorToRgba(
                    accent,
                    0.055
                  )}`
                } satisfies CSSProperties;

                return (
                  <div
                    key={account.id}
                    className="group relative overflow-hidden rounded-[1.35rem] border bg-slate-950/30 p-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/46 motion-reduce:hover:translate-y-0"
                    style={cardStyle}
                  >
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
                      style={{ backgroundColor: colorToRgba(accent, 0.14) }}
                      aria-hidden="true"
                    />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition group-hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${colorToRgba(
                              accent,
                              0.24
                            )}, rgba(15,23,42,0.80))`
                          }}
                        >
                          <AppIcon name={account.icon ?? meta.icon} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{account.name}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{meta.description}</p>
                        </div>
                      </div>
                      <Badge tone="blue" className="shrink-0 capitalize">
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="relative mt-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Current balance
                      </p>
                      <p className="mt-1 break-words text-2xl font-black tracking-tight text-white">
                        {formatCurrency(currentBalance)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800/75 bg-slate-950/40 px-2.5 py-1 text-slate-300">
                          Initial {formatCurrency(initialBalance)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1",
                            movement > 0
                              ? "border-income/25 bg-income/10 text-green-300"
                              : movement < 0
                                ? "border-expense/25 bg-expense/10 text-red-300"
                                : "border-slate-800/75 bg-slate-950/40 text-slate-400"
                          )}
                        >
                          {movement === 0
                            ? "No movement yet"
                            : `${movement > 0 ? "+" : ""}${formatCurrency(movement)}`}
                        </span>
                        <span className="rounded-full border border-accent/18 bg-sky/10 px-2.5 py-1 text-cyan-100">
                          Tracked account
                        </span>
                      </div>
                    </div>

                    <div className="relative mt-5 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300/40 hover:bg-cyan-400/15"
                        onClick={() => openReconcile(account)}
                      >
                        <Scale className="h-4 w-4" aria-hidden="true" />
                        Reconcile
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => startEdit(account)}
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl border-slate-800/80 bg-slate-950/35 text-slate-500 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-200 focus-visible:ring-red-400"
                        onClick={() => void deleteAccount(account)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
      <Modal
        open={Boolean(reconcileAccount)}
        title="Reconcile Account"
        onClose={() => setReconcileAccount(null)}
        className="max-w-lg"
      >
        <form className="space-y-4" onSubmit={handleReconcile}>
          <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/10 p-3 text-sm leading-6 text-cyan-50">
            Set the real balance for {reconcileAccount?.name ?? "this account"}. DFT will create a
            Balance Adjustment transaction so the ledger remains traceable.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/45 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Current in DFT
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {formatCurrency(Number(reconcileAccount?.current_balance ?? 0))}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/45 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Adjustment
              </p>
              <p
                className={cn(
                  "mt-2 text-lg font-black",
                  amountToNumber(reconcileBalance) - Number(reconcileAccount?.current_balance ?? 0) >= 0
                    ? "text-green-300"
                    : "text-red-300"
                )}
              >
                {formatCurrency(
                  amountToNumber(reconcileBalance) - Number(reconcileAccount?.current_balance ?? 0)
                )}
              </p>
            </div>
          </div>
          <label className="block">
            <span className={fieldLabelClass}>Real balance</span>
            <Input
              className={controlClass}
              inputMode="numeric"
              value={formatAmountInput(reconcileBalance)}
              onChange={(event) => setReconcileBalance(sanitizeAmountInput(event.target.value))}
              placeholder="319.000"
              required
            />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>Adjustment note</span>
            <Input
              className={controlClass}
              value={reconcileNote}
              onChange={(event) => setReconcileNote(event.target.value)}
              placeholder="Optional note for this balance adjustment"
            />
          </label>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800/70 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReconcileAccount(null)}
              disabled={reconciling}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={reconciling}>
              <Scale className="h-4 w-4" aria-hidden="true" />
              {reconciling ? "Reconciling..." : "Create adjustment"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
