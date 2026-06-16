"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Layers3,
  Plus,
  RefreshCw,
  WalletCards,
  X
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { todayInputValue } from "@/lib/finance/client-api";
import { formatCurrency } from "@/lib/finance/format";
import { requestJson } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Account, CapitalEntry } from "@/types/entities";
import type { Workspace } from "@/lib/workspaces";

type CapitalType = "owner_capital_in" | "owner_withdrawal" | "reimbursement";

type CapitalFormState = {
  type: CapitalType;
  amount: string;
  date: string;
  account_id: string;
  notes: string;
  source: string;
  reference: string;
  payment_method: string;
};

type CapitalManagerProps = {
  activeWorkspace: Workspace | null;
};

const emptyForm: CapitalFormState = {
  type: "owner_capital_in",
  amount: "",
  date: todayInputValue(),
  account_id: "",
  notes: "",
  source: "",
  reference: "",
  payment_method: ""
};

const capitalTypeLabels: Record<CapitalType, string> = {
  owner_capital_in: "Owner Capital In",
  owner_withdrawal: "Owner Withdrawal",
  reimbursement: "Reimbursement"
};

const capitalTypeStyles: Record<CapitalType, string> = {
  owner_capital_in: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  owner_withdrawal: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  reimbursement: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200"
};

const fieldLabelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400/95";
const controlClass =
  "h-12 rounded-2xl border-cyan-400/15 bg-[#050816]/78 px-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_34px_rgba(0,0,0,0.18)] placeholder:text-slate-500/70 hover:border-cyan-300/28 hover:bg-slate-950/82 focus:border-cyan-300/55 focus:bg-[#050816]/90 focus:ring-accent-soft/20";

function sanitizeNumberInput(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function formatThousands(value: string) {
  const digits = sanitizeNumberInput(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function toNumber(value: string) {
  return Number(sanitizeNumberInput(value) || "0");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function SummaryCard({
  helper,
  icon,
  label,
  tone = "cyan",
  value
}: {
  helper: string;
  icon: React.ReactNode;
  label: string;
  tone?: "cyan" | "green" | "rose" | "indigo";
  value: string;
}) {
  const valueClass = {
    cyan: "text-cyan-100",
    green: "text-green-300",
    indigo: "text-indigo-200",
    rose: "text-red-300"
  }[tone];

  const iconClass = {
    cyan: "border-accent/20 bg-sky/10 text-accent-soft",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200"
  }[tone];

  return (
    <Card className="dashboard-stat-card relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className={cn("mt-2 truncate text-2xl font-black", valueClass)}>{value}</p>
          <p className="mt-1 text-xs text-muted">{helper}</p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl border", iconClass)}>
          {icon}
        </span>
      </div>
    </Card>
  );
}

export function CapitalManager({ activeWorkspace }: CapitalManagerProps) {
  const [capitalEntries, setCapitalEntries] = useState<CapitalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<CapitalFormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isBusinessWorkspace = activeWorkspace?.type === "business";

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const totals = useMemo(() => {
    const ownerCapitalIn = capitalEntries
      .filter((entry) => entry.type === "owner_capital_in")
      .reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
    const ownerWithdrawal = capitalEntries
      .filter((entry) => entry.type === "owner_withdrawal")
      .reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
    const reimbursement = capitalEntries
      .filter((entry) => entry.type === "reimbursement")
      .reduce((total, entry) => total + Number(entry.amount ?? 0), 0);

    return {
      netCapital: ownerCapitalIn - ownerWithdrawal - reimbursement,
      ownerCapitalIn,
      ownerWithdrawal,
      reimbursement
    };
  }, [capitalEntries]);

  async function loadCapitalData() {
    if (!isBusinessWorkspace) {
      setAccounts([]);
      setCapitalEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [entryData, accountData] = await Promise.all([
        requestJson<{ capitalEntries: CapitalEntry[] }>("/api/capital-entries"),
        requestJson<{ accounts: Account[] }>("/api/accounts")
      ]);
      setCapitalEntries(entryData.capitalEntries);
      setAccounts(accountData.accounts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load capital ledger.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCapitalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id, isBusinessWorkspace]);

  function openCapitalModal() {
    if (!isBusinessWorkspace) {
      toast.info("Capital tracking is available for business workspaces only.");
      return;
    }

    setForm({
      ...emptyForm,
      date: todayInputValue()
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (toNumber(form.amount) <= 0) {
      toast.error("Enter a valid capital amount.");
      return;
    }

    setSaving(true);
    try {
      await requestJson<{ capitalEntry: CapitalEntry }>("/api/capital-entries", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          account_id: form.account_id || null,
          amount: toNumber(form.amount)
        })
      });

      toast.success("Capital entry added.");
      setModalOpen(false);
      setForm(emptyForm);
      await loadCapitalData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save capital entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-enter space-y-5 pb-24 xl:pb-10">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-800/70 bg-slate-950/42 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.30),0_0_28px_rgba(34,211,238,0.04)] backdrop-blur-xl sm:p-6">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />
              Funding Ledger
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Capital
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Track owner capital, withdrawals, reimbursements, and business funding.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={openCapitalModal}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Capital Entry
          </Button>
        </div>
      </section>

      {!isBusinessWorkspace ? (
        <Card className="dashboard-chart-card overflow-hidden p-5">
          <div className="rounded-[1.5rem] border border-accent/18 bg-slate-950/36 p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/20 bg-sky/10 text-accent-soft">
              <Layers3 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-black text-white">Business workspace required</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
              Capital tracking belongs to your business workspace so owner funding and withdrawals
              stay separate from Personal Finance.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              helper="Owner funding"
              icon={<ArrowUpRight className="h-5 w-5" aria-hidden="true" />}
              label="Owner Capital In"
              tone="green"
              value={formatCurrency(totals.ownerCapitalIn)}
            />
            <SummaryCard
              helper="Owner draws"
              icon={<ArrowDownLeft className="h-5 w-5" aria-hidden="true" />}
              label="Owner Withdrawal"
              tone="rose"
              value={formatCurrency(totals.ownerWithdrawal)}
            />
            <SummaryCard
              helper="Funding balance"
              icon={<WalletCards className="h-5 w-5" aria-hidden="true" />}
              label="Net Capital"
              tone={totals.netCapital < 0 ? "rose" : "cyan"}
              value={formatCurrency(totals.netCapital)}
            />
            <SummaryCard
              helper="Business payback"
              icon={<RefreshCw className="h-5 w-5" aria-hidden="true" />}
              label="Reimbursement"
              tone="indigo"
              value={formatCurrency(totals.reimbursement)}
            />
          </section>

          <Card className="dashboard-chart-card overflow-hidden p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[1.35rem] border border-slate-800/70 bg-slate-950/52"
                  />
                ))}
              </div>
            ) : capitalEntries.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/28 p-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/20 bg-sky/10 text-accent-soft">
                  <HandCoins className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-black text-white">
                  No capital transactions yet
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
                  Add owner funding, withdrawals, or reimbursements to see capital movement here.
                </p>
                <Button className="mt-5" onClick={openCapitalModal}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Capital Entry
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-soft">
                      Capital Movement
                    </p>
                    <h2 className="mt-2 text-xl font-black text-white">Funding ledger</h2>
                  </div>
                  <Button size="sm" onClick={openCapitalModal}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Capital Entry
                  </Button>
                </div>
                <div className="space-y-3">
                  {capitalEntries.map((entry) => {
                    const entryType = entry.type as CapitalType;
                    const accountName = entry.account_id
                      ? accountNameById.get(entry.account_id) ?? "Linked account"
                      : "No account selected";

                    return (
                      <article
                        key={entry.id}
                        className="rounded-[1.35rem] border border-slate-800/70 bg-slate-950/48 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-accent/25"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                                  capitalTypeStyles[entryType]
                                )}
                              >
                                {capitalTypeLabels[entryType]}
                              </span>
                              <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                            </div>
                            <p className="mt-2 truncate text-sm font-semibold text-slate-200">
                              {accountName}
                            </p>
                            {entry.notes ? (
                              <p className="mt-1 text-xs leading-5 text-slate-400">{entry.notes}</p>
                            ) : null}
                          </div>
                          <p
                            className={cn(
                              "text-xl font-black",
                              entryType === "owner_capital_in"
                                ? "text-green-300"
                                : entryType === "owner_withdrawal"
                                  ? "text-red-300"
                                  : "text-indigo-200"
                            )}
                          >
                            {formatCurrency(Number(entry.amount ?? 0))}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        open={modalOpen}
        title="Add Capital Entry"
        onClose={() => setModalOpen(false)}
        className="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={fieldLabelClass}>Entry Type</span>
              <Select
                className={controlClass}
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as CapitalType }))
                }
              >
                <option value="owner_capital_in">Owner Capital In</option>
                <option value="owner_withdrawal">Owner Withdrawal</option>
                <option value="reimbursement">Reimbursement</option>
              </Select>
            </label>
            <label>
              <span className={fieldLabelClass}>Amount</span>
              <Input
                className={controlClass}
                inputMode="numeric"
                value={formatThousands(form.amount)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: sanitizeNumberInput(event.target.value) }))
                }
                placeholder="1.000.000"
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Date</span>
              <Input
                className={controlClass}
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Account / Wallet</span>
              <Select
                className={controlClass}
                value={form.account_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, account_id: event.target.value }))
                }
              >
                <option value="">No account selected</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Selecting an account improves cash flow accuracy.{" "}
                <Link className="font-semibold text-cyan-200 hover:text-white" href="/accounts">
                  Add Business Account
                </Link>
              </p>
            </label>
            <label>
              <span className={fieldLabelClass}>Source</span>
              <Input
                className={controlClass}
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                placeholder="Owner transfer"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Reference</span>
              <Input
                className={controlClass}
                value={form.reference}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reference: event.target.value }))
                }
                placeholder="TRX-001"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Payment Method</span>
              <Input
                className={controlClass}
                value={form.payment_method}
                onChange={(event) =>
                  setForm((current) => ({ ...current, payment_method: event.target.value }))
                }
                placeholder="Bank transfer"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Notes</span>
              <Input
                className={controlClass}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional capital note"
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800/70 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : "Save capital entry"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
