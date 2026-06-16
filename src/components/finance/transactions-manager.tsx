"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  Edit3,
  Filter,
  MoveRight,
  Plus,
  SearchX,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
import type { Account, Category, Transaction } from "@/types/entities";
import type { TransactionType } from "@/types/finance";
import type { Workspace } from "@/lib/workspaces";

type TransactionFormState = {
  type: TransactionType;
  amount: string;
  category_id: string;
  account_id: string;
  transfer_from_account_id: string;
  transfer_to_account_id: string;
  date: string;
  note: string;
};

type TransactionFilters = {
  date_from: string;
  date_to: string;
  type: "all" | TransactionType;
  category_id: string;
  account_id: string;
};

type MoveFormState = {
  target_workspace_id: string;
  target_type: TransactionType;
  category_id: string;
  account_id: string;
  transfer_from_account_id: string;
  transfer_to_account_id: string;
  note: string;
  copy: boolean;
};

type MigrationOptionsByWorkspace = Record<
  string,
  {
    accounts: Account[];
    categories: Category[];
  }
>;

const emptyForm: TransactionFormState = {
  type: "expense",
  amount: "",
  category_id: "",
  account_id: "",
  transfer_from_account_id: "",
  transfer_to_account_id: "",
  date: todayInputValue(),
  note: ""
};

const emptyFilters: TransactionFilters = {
  date_from: "",
  date_to: "",
  type: "all",
  category_id: "",
  account_id: ""
};

const emptyMoveForm: MoveFormState = {
  target_workspace_id: "",
  target_type: "expense",
  category_id: "",
  account_id: "",
  transfer_from_account_id: "",
  transfer_to_account_id: "",
  note: "",
  copy: false
};

const businessKeywords = [
  "davenue",
  "bisnis",
  "modal",
  "shopee",
  "seller",
  "parfum",
  "inventory",
  "packaging",
  "refund",
  "cashback",
  "profit",
  "jualan",
  "ongkir"
];

const fieldLabelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400";
const controlClass =
  "h-12 rounded-2xl border-slate-800/85 bg-slate-950/58 px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_30px_rgba(0,0,0,0.16)] placeholder:text-slate-600 hover:border-accent/25 hover:bg-slate-950/72 focus:border-accent/55 focus:bg-slate-950/80 focus:ring-accent-soft/20";
const selectControlClass = `${controlClass} cursor-pointer pr-9`;
const compactControlClass =
  "h-11 rounded-2xl border-slate-800/80 bg-slate-950/50 px-3 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] placeholder:text-slate-600 hover:border-accent/25 focus:border-accent/55";

function sanitizeAmountInput(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function formatAmountInput(value: string) {
  const digits = sanitizeAmountInput(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function includesBusinessKeyword(transaction: Transaction, category?: Category | null) {
  const text = `${transaction.note ?? ""} ${category?.name ?? ""}`.toLowerCase();
  return businessKeywords.some((keyword) => text.includes(keyword));
}

function accountNameMatches(account: Account, names: string[]) {
  const normalized = account.name.toLowerCase();
  return names.some((name) => normalized.includes(name.toLowerCase()));
}

function getRecommendedBusinessAccount(
  transactions: Transaction[],
  accounts: Account[],
  categoryMap: Map<string, Category>
) {
  if (transactions.length === 0 || accounts.length === 0) {
    return null;
  }

  const combinedText = transactions
    .map((transaction) =>
      `${transaction.note ?? ""} ${categoryMap.get(transaction.category_id ?? "")?.name ?? ""}`
    )
    .join(" ")
    .toLowerCase();

  const ruleOrder = [
    {
      keywords: ["shopee seller", "seller balance", "saldo seller", "seller center"],
      names: ["Shopee Seller Balance"]
    },
    {
      keywords: ["seabank", "sea bank"],
      names: ["SeaBank Davenue"]
    },
    {
      keywords: ["shopeepay", "shopee pay"],
      names: ["Davenue ShopeePay"]
    },
    {
      keywords: ["gopay", "go pay"],
      names: ["Davenue GoPay"]
    },
    {
      keywords: ["cash", "tunai", "modal", "owner capital"],
      names: ["Business Cash"]
    }
  ];

  for (const rule of ruleOrder) {
    if (rule.keywords.some((keyword) => combinedText.includes(keyword))) {
      const account = accounts.find((item) => accountNameMatches(item, rule.names));

      if (account) {
        return account;
      }
    }
  }

  return null;
}

export function TransactionsManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [migrationOptionsByWorkspace, setMigrationOptionsByWorkspace] =
    useState<MigrationOptionsByWorkspace>({});
  const [form, setForm] = useState<TransactionFormState>(emptyForm);
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [moveForm, setMoveForm] = useState<MoveFormState>(emptyMoveForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [migrationOptionsLoaded, setMigrationOptionsLoaded] = useState(false);
  const [migrationOptionsLoading, setMigrationOptionsLoading] = useState(false);
  const [migrationOptionsError, setMigrationOptionsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);

  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const matchingCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );
  const matchingTargetCategories = useMemo(
    () =>
      (migrationOptionsByWorkspace[moveForm.target_workspace_id]?.categories ?? []).filter(
        (category) => category.type === moveForm.target_type
      ),
    [migrationOptionsByWorkspace, moveForm.target_type, moveForm.target_workspace_id]
  );
  const targetAccounts = useMemo(
    () => migrationOptionsByWorkspace[moveForm.target_workspace_id]?.accounts ?? [],
    [migrationOptionsByWorkspace, moveForm.target_workspace_id]
  );
  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => selectedTransactionIds.includes(transaction.id)),
    [selectedTransactionIds, transactions]
  );
  const recommendedTargetAccount = useMemo(
    () => getRecommendedBusinessAccount(selectedTransactions, targetAccounts, categoryMap),
    [categoryMap, selectedTransactions, targetAccounts]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      if (filters.date_from && transaction.date < filters.date_from) {
        return false;
      }

      if (filters.date_to && transaction.date > filters.date_to) {
        return false;
      }

      if (filters.category_id && transaction.category_id !== filters.category_id) {
        return false;
      }

      if (
        filters.account_id &&
        transaction.account_id !== filters.account_id &&
        transaction.transfer_from_account_id !== filters.account_id &&
        transaction.transfer_to_account_id !== filters.account_id
      ) {
        return false;
      }

      return true;
    });
  }, [filters, transactions]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount ?? 0);

        if (transaction.type === "income") {
          summary.income += amount;
        } else if (transaction.type === "expense") {
          summary.expense += amount;
        }

        return summary;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  async function loadData() {
    setLoading(true);
    try {
      const [accountsData, categoriesData, transactionsData] = await Promise.all([
        requestJson<{ accounts: Account[] }>("/api/accounts"),
        requestJson<{ categories: Category[] }>("/api/categories"),
        requestJson<{ transactions: Transaction[] }>("/api/transactions")
      ]);

      setAccounts(accountsData.accounts);
      setCategories(categoriesData.categories);
      setTransactions(transactionsData.transactions);
      setSelectedTransactionIds((current) =>
        current.filter((id) =>
          transactionsData.transactions.some((transaction) => transaction.id === id)
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function loadMigrationOptions() {
    if (migrationOptionsLoaded || migrationOptionsLoading) {
      return;
    }

    setMigrationOptionsLoading(true);
    setMigrationOptionsError(null);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12_000);
      const data = await requestJson<{
        accounts: Account[];
        categories: Category[];
        workspaces: Workspace[];
      }>("/api/transaction-migration-options", { signal: controller.signal }).finally(() =>
        window.clearTimeout(timeout)
      );
      const optionsByWorkspace = data.workspaces.reduce<MigrationOptionsByWorkspace>(
        (options, workspace) => ({
          ...options,
          [workspace.id]: {
            accounts: data.accounts.filter((account) => account.workspace_id === workspace.id),
            categories: data.categories.filter((category) => category.workspace_id === workspace.id)
          }
        }),
        {}
      );

      setWorkspaces(data.workspaces);
      setMigrationOptionsByWorkspace(optionsByWorkspace);
      setMigrationOptionsLoaded(true);
      setMoveForm((current) => ({
        ...current,
        target_workspace_id:
          current.target_workspace_id ||
          data.workspaces[0]?.id ||
          ""
      }));
    } catch (error) {
      console.error("[transactions:migration-options]", error);
      setMigrationOptionsError(
        error instanceof Error ? error.message : "Could not load migration options. Try again."
      );
    } finally {
      setMigrationOptionsLoading(false);
    }
  }

  useEffect(() => {
    if (moveModalOpen) {
      void loadMigrationOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveModalOpen]);

  function resetForm() {
    setForm({
      ...emptyForm,
      date: todayInputValue()
    });
    setEditingId(null);
  }

  function startEdit(transaction: Transaction) {
    setEditingId(transaction.id);
    setForm({
      type: transaction.type as TransactionType,
      amount: sanitizeAmountInput(String(transaction.amount ?? "")),
      category_id: transaction.category_id ?? "",
      account_id: transaction.account_id ?? "",
      transfer_from_account_id: transaction.transfer_from_account_id ?? "",
      transfer_to_account_id: transaction.transfer_to_account_id ?? "",
      date: transaction.date,
      note: transaction.note ?? ""
    });
  }

  function buildPayload() {
    const base = {
      type: form.type,
      amount: Number(sanitizeAmountInput(form.amount)),
      date: form.date,
      note: form.note.trim() ? form.note.trim() : null,
      source: "manual" as const
    };

    if (form.type === "transfer") {
      return {
        ...base,
        category_id: null,
        account_id: null,
        transfer_from_account_id: form.transfer_from_account_id || null,
        transfer_to_account_id: form.transfer_to_account_id || null
      };
    }

    return {
      ...base,
      category_id: form.category_id || null,
      account_id: form.account_id || null,
      transfer_from_account_id: null,
      transfer_to_account_id: null
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(sanitizeAmountInput(form.amount));

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid transaction amount.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await requestJson<{ transaction: Transaction }>(`/api/transactions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(buildPayload())
        });
        toast.success("Transaction updated successfully.");
      } else {
        await requestJson<{ transaction: Transaction }>("/api/transactions", {
          method: "POST",
          body: JSON.stringify(buildPayload())
        });
        toast.success("Transaction added successfully.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(transaction: Transaction) {
    const confirmed = window.confirm("Delete this transaction?");

    if (!confirmed) {
      return;
    }

    try {
      await requestJson<{ ok: true }>(`/api/transactions/${transaction.id}`, {
        method: "DELETE"
      });
      toast.success("Transaction deleted.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete transaction.");
    }
  }

  function toggleTransactionSelection(transactionId: string) {
    setSelectedTransactionIds((current) =>
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId]
    );
  }

  function selectBusinessKeywordMatches() {
    const keywordMatches = filteredTransactions
      .filter((transaction) => includesBusinessKeyword(transaction, categoryMap.get(transaction.category_id ?? "")))
      .map((transaction) => transaction.id);

    if (keywordMatches.length === 0) {
      toast.info("No business keyword matches found in the current list.");
      return;
    }

    setSelectedTransactionIds(Array.from(new Set([...selectedTransactionIds, ...keywordMatches])));
    toast.success(`${keywordMatches.length} business-related transaction(s) selected.`);
  }

  function openMoveModal() {
    if (selectedTransactionIds.length === 0) {
      toast.error("Select at least one transaction first.");
      return;
    }

    setMoveModalOpen(true);
    void loadMigrationOptions();
  }

  async function handleMoveSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!moveForm.target_workspace_id) {
      toast.error("Choose a target workspace.");
      return;
    }

    if (moveForm.target_type !== "transfer" && !moveForm.account_id) {
      toast.error("Choose a target account.");
      return;
    }

    const confirmed = window.confirm(
      `Move ${selectedTransactionIds.length} transaction(s) to the selected workspace? Reports in both workspaces will change.`
    );

    if (!confirmed) {
      return;
    }

    setMoving(true);
    try {
      const result = await requestJson<{ copied: number; moved: number }>("/api/transactions/move", {
        method: "POST",
        body: JSON.stringify({
          transaction_ids: selectedTransactionIds,
          target_workspace_id: moveForm.target_workspace_id,
          target_type: moveForm.target_type,
          category_id: moveForm.target_type === "transfer" ? null : moveForm.category_id || null,
          account_id: moveForm.target_type === "transfer" ? null : moveForm.account_id || null,
          transfer_from_account_id:
            moveForm.target_type === "transfer" ? moveForm.transfer_from_account_id || null : null,
          transfer_to_account_id:
            moveForm.target_type === "transfer" ? moveForm.transfer_to_account_id || null : null,
          note: moveForm.note.trim() ? moveForm.note.trim() : null,
          copy: moveForm.copy
        })
      });

      toast.success(
        moveForm.copy
          ? `${result.copied} transaction(s) copied.`
          : `${result.moved} transaction(s) moved.`
      );
      setMoveModalOpen(false);
      setSelectedTransactionIds([]);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move transactions.");
    } finally {
      setMoving(false);
    }
  }

  function accountLabel(transaction: Transaction) {
    if (transaction.type === "transfer") {
      const from = accountMap.get(transaction.transfer_from_account_id ?? "")?.name ?? "Unknown";
      const to = accountMap.get(transaction.transfer_to_account_id ?? "")?.name ?? "Unknown";
      return `${from} to ${to}`;
    }

    return accountMap.get(transaction.account_id ?? "")?.name ?? "Unknown account";
  }

  function categoryLabel(transaction: Transaction) {
    if (transaction.type === "transfer") {
      return "Transfer";
    }

    return categoryMap.get(transaction.category_id ?? "")?.name ?? "Uncategorized";
  }

  function moveToTransactionForm() {
    resetForm();
    document.getElementById("transaction-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "" && value !== "all");
  const showEmptyLedger = transactions.length === 0;

  return (
    <>
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="dashboard-stat-card relative overflow-hidden p-3.5 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Filtered Income
          </p>
          <p className="mt-2 text-xl font-black tracking-tight text-green-300 sm:text-2xl">
            {formatCurrency(totals.income)}
          </p>
        </Card>
        <Card className="dashboard-stat-card relative overflow-hidden p-3.5 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Filtered Expense
          </p>
          <p className="mt-2 text-xl font-black tracking-tight text-red-300 sm:text-2xl">
            {formatCurrency(totals.expense)}
          </p>
        </Card>
        <Card className="dashboard-stat-card relative overflow-hidden p-3.5 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Net Result
          </p>
          <p className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            {formatCurrency(totals.income - totals.expense)}
          </p>
        </Card>
      </section>

      <div className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <Card
          id="transaction-form"
          className="transactions-form-card dashboard-chart-card overflow-hidden xl:sticky xl:top-28 xl:self-start"
        >
          <CardHeader className="mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
                Ledger Entry
              </p>
              <CardTitle className="mt-2 text-xl font-black tracking-tight">
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </CardTitle>
              <CardDescription className="leading-6">
                Income, expense, and transfers use the same IDR ledger.
              </CardDescription>
            </div>
            {editingId ? (
              <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Cancel edit">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            ) : null}
          </CardHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>Type</span>
                <Select
                  className={selectControlClass}
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as TransactionType,
                      category_id: "",
                      account_id: "",
                      transfer_from_account_id: "",
                      transfer_to_account_id: ""
                    }))
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </Select>
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Amount</span>
                <Input
                  className={controlClass}
                  inputMode="numeric"
                  value={formatAmountInput(form.amount)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: sanitizeAmountInput(event.target.value)
                    }))
                  }
                  placeholder="250.000"
                  required
                />
              </label>
            </div>

            {form.type === "transfer" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClass}>From account</span>
                  <Select
                    className={selectControlClass}
                    value={form.transfer_from_account_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        transfer_from_account_id: event.target.value
                      }))
                    }
                    required
                  >
                    <option value="">Choose account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>To account</span>
                  <Select
                    className={selectControlClass}
                    value={form.transfer_to_account_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        transfer_to_account_id: event.target.value
                      }))
                    }
                    required
                  >
                    <option value="">Choose account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClass}>Category</span>
                  <Select
                    className={selectControlClass}
                    value={form.category_id}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category_id: event.target.value }))
                    }
                  >
                    <option value="">Uncategorized</option>
                    {matchingCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>Account</span>
                  <Select
                    className={selectControlClass}
                    value={form.account_id}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, account_id: event.target.value }))
                    }
                    required
                  >
                    <option value="">Choose account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            )}

            <label className="block">
              <span className={fieldLabelClass}>Date</span>
              <Input
                className={controlClass}
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </label>

            <label className="block">
              <span className={fieldLabelClass}>Note</span>
              <Input
                className={controlClass}
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Lunch, salary, transfer to savings..."
              />
            </label>

            <Button className="h-12 w-full rounded-2xl" type="submit" disabled={saving}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : editingId ? "Update transaction" : "Add transaction"}
            </Button>
          </form>
        </Card>

        <Card className="dashboard-chart-card overflow-hidden">
          <CardHeader className="mb-5">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} shown from {transactions.length} total
              </CardDescription>
            </div>
            <Badge tone="accent">IDR</Badge>
          </CardHeader>

          <div className="mb-5 rounded-[1.35rem] border border-slate-800/75 bg-slate-950/28 p-3.5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                <Filter className="h-4 w-4 text-accent-soft" aria-hidden="true" />
                Filters
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setFilters(emptyFilters)}
                  className="text-xs font-semibold text-cyan-200 transition hover:text-white"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              <Input
                className={compactControlClass}
                type="date"
                value={filters.date_from}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, date_from: event.target.value }))
                }
                aria-label="Filter from date"
              />
              <Input
                className={compactControlClass}
                type="date"
                value={filters.date_to}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, date_to: event.target.value }))
                }
                aria-label="Filter to date"
              />
              <Select
                className={compactControlClass}
                value={filters.type}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    type: event.target.value as TransactionFilters["type"]
                  }))
                }
                aria-label="Filter type"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </Select>
              <Select
                className={compactControlClass}
                value={filters.category_id}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category_id: event.target.value }))
                }
                aria-label="Filter category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <Select
                className={compactControlClass}
                value={filters.account_id}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, account_id: event.target.value }))
                }
                aria-label="Filter account"
              >
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-3">
              <p className="text-xs text-slate-400">
                {selectedTransactionIds.length} selected for workspace migration
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={selectBusinessKeywordMatches}>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Select business matches
                </Button>
                <Button type="button" size="sm" onClick={openMoveModal}>
                  <MoveRight className="h-4 w-4" aria-hidden="true" />
                  Move to Workspace
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <LoadingSkeleton className="h-20" />
              <LoadingSkeleton className="h-20" />
              <LoadingSkeleton className="h-20" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/25 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-soft">
                <SearchX className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 font-bold text-white">
                {showEmptyLedger ? "No transactions yet" : "No matching transactions"}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                {showEmptyLedger
                  ? "Add your first income or expense to start tracking your money."
                  : "Adjust your filters or clear them to reveal more ledger activity."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button type="button" size="sm" onClick={moveToTransactionForm}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add transaction
                </Button>
                {showEmptyLedger ? (
                  <Link
                    href="/ai-assistant"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-accent/35 hover:bg-sky/10 hover:text-cyan-100"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Try AI Quick Add
                  </Link>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={() => setFilters(emptyFilters)}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const isIncome = transaction.type === "income";
                const isTransfer = transaction.type === "transfer";
                const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowDownLeft : ArrowUpRight;

                return (
                  <div
                    key={transaction.id}
                    className="group rounded-[1.35rem] border border-slate-800/75 bg-slate-950/30 p-3.5 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:bg-slate-900/48 hover:shadow-[0_16px_48px_rgba(34,211,238,0.065)] motion-reduce:hover:translate-y-0 sm:p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <label className="mt-3 inline-flex h-5 w-5 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-300 accent-cyan-300"
                            checked={selectedTransactionIds.includes(transaction.id)}
                            onChange={() => toggleTransactionSelection(transaction.id)}
                            aria-label="Select transaction"
                          />
                        </label>
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-105",
                            isIncome
                              ? "border-income/20 bg-income/10 text-green-300"
                              : isTransfer
                                ? "border-sky/20 bg-sky/10 text-sky-200"
                                : "border-expense/20 bg-expense/10 text-red-300"
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-white">
                            {transaction.note || categoryLabel(transaction)}
                            </p>
                            <Badge tone={isIncome ? "green" : isTransfer ? "blue" : "red"}>
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                            <span className="rounded-full border border-slate-800/80 bg-slate-950/38 px-2.5 py-1">
                              {categoryLabel(transaction)}
                            </span>
                            <span className="rounded-full border border-slate-800/80 bg-slate-950/38 px-2.5 py-1">
                              {accountLabel(transaction)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-950/38 px-2.5 py-1">
                              <CalendarDays className="h-3.5 w-3.5 text-cyan-200/70" aria-hidden="true" />
                              {transaction.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <p
                          className={cn(
                            "min-w-36 rounded-2xl border bg-slate-950/42 px-3 py-2 text-right text-sm font-black",
                            isIncome ? "text-green-300" : isTransfer ? "text-sky-200" : "text-red-300"
                          )}
                        >
                          {isIncome ? "+" : isTransfer ? "" : "-"}
                          {formatCurrency(Number(transaction.amount ?? 0))}
                        </p>
                        <Button
                          className="rounded-xl"
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(transaction)}
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => void deleteTransaction(transaction)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </Button>
                      </div>
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
        open={moveModalOpen}
        title="Move to Workspace"
        onClose={() => setMoveModalOpen(false)}
        className="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleMoveSubmit}>
          <div className="rounded-2xl border border-accent/20 bg-sky/10 p-3 text-sm font-semibold text-cyan-100">
            {selectedTransactionIds.length} transaction
            {selectedTransactionIds.length === 1 ? "" : "s"} selected
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
            Moving transactions will change reports in the source and target workspaces.
            Default mode is move, not copy, to avoid double counting.
          </div>
          {migrationOptionsLoading ? (
            <div className="rounded-2xl border border-slate-800/75 bg-slate-950/48 p-3 text-sm text-slate-300">
              Loading migration options...
            </div>
          ) : null}
          {migrationOptionsError ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100">
              Could not load migration options. Try again.
              <div className="mt-2 text-xs text-rose-200/80">{migrationOptionsError}</div>
              <Button
                className="mt-3"
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => {
                  setMigrationOptionsLoaded(false);
                  void loadMigrationOptions();
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={fieldLabelClass}>Target Workspace</span>
              <Select
                className={selectControlClass}
                value={moveForm.target_workspace_id}
                onChange={(event) =>
                  setMoveForm((current) => ({
                    ...current,
                    target_workspace_id: event.target.value,
                    account_id: "",
                    category_id: "",
                    transfer_from_account_id: "",
                    transfer_to_account_id: ""
                  }))
                }
                required
                disabled={migrationOptionsLoading}
              >
                <option value="">
                  {migrationOptionsLoading ? "Loading workspaces..." : "Choose workspace"}
                </option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className={fieldLabelClass}>Target Type</span>
              <Select
                className={selectControlClass}
                value={moveForm.target_type}
                onChange={(event) =>
                  setMoveForm((current) => ({
                    ...current,
                    target_type: event.target.value as TransactionType,
                    category_id: "",
                    account_id: "",
                    transfer_from_account_id: "",
                    transfer_to_account_id: ""
                  }))
                }
                required
                disabled={migrationOptionsLoading || Boolean(migrationOptionsError)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </Select>
            </label>
            {moveForm.target_type === "transfer" ? (
              <>
                <label className="block">
                  <span className={fieldLabelClass}>From Account</span>
                  <Select
                    className={selectControlClass}
                    value={moveForm.transfer_from_account_id}
                    onChange={(event) =>
                      setMoveForm((current) => ({
                        ...current,
                        transfer_from_account_id: event.target.value
                      }))
                    }
                    required
                    disabled={migrationOptionsLoading || Boolean(migrationOptionsError)}
                  >
                    <option value="">
                      {migrationOptionsLoading ? "Loading accounts..." : "Choose account"}
                    </option>
                    {targetAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>To Account</span>
                  <Select
                    className={selectControlClass}
                    value={moveForm.transfer_to_account_id}
                    onChange={(event) =>
                      setMoveForm((current) => ({
                        ...current,
                        transfer_to_account_id: event.target.value
                      }))
                    }
                    required
                    disabled={migrationOptionsLoading || Boolean(migrationOptionsError)}
                  >
                    <option value="">
                      {migrationOptionsLoading ? "Loading accounts..." : "Choose account"}
                    </option>
                    {targetAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <span className={fieldLabelClass}>Target Category</span>
                  <Select
                    className={selectControlClass}
                    value={moveForm.category_id}
                    onChange={(event) =>
                      setMoveForm((current) => ({ ...current, category_id: event.target.value }))
                    }
                  >
                    <option value="">
                      {migrationOptionsLoading ? "Loading categories..." : "Uncategorized"}
                    </option>
                    {matchingTargetCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>Target Account</span>
                  <Select
                    className={selectControlClass}
                    value={moveForm.account_id}
                    onChange={(event) =>
                      setMoveForm((current) => ({ ...current, account_id: event.target.value }))
                    }
                    required
                    disabled={migrationOptionsLoading || Boolean(migrationOptionsError)}
                  >
                    <option value="">
                      {migrationOptionsLoading ? "Loading accounts..." : "Choose account"}
                    </option>
                    {targetAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                  {recommendedTargetAccount &&
                  recommendedTargetAccount.id !== moveForm.account_id ? (
                    <button
                      type="button"
                      suppressHydrationWarning
                      className="mt-2 inline-flex items-center gap-2 rounded-xl border border-cyan-400/18 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                      onClick={() =>
                        setMoveForm((current) => ({
                          ...current,
                          account_id: recommendedTargetAccount.id
                        }))
                      }
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Use recommended account: {recommendedTargetAccount.name}
                    </button>
                  ) : null}
                </label>
              </>
            )}
            <label className="block md:col-span-2">
              <span className={fieldLabelClass}>Optional Note Update</span>
              <Input
                className={controlClass}
                value={moveForm.note}
                onChange={(event) =>
                  setMoveForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Leave blank to preserve the original note"
              />
            </label>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3 text-sm text-slate-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-cyan-300"
              checked={moveForm.copy}
              onChange={(event) =>
                setMoveForm((current) => ({ ...current, copy: event.target.checked }))
              }
            />
            Copy instead of move. Use only when you intentionally need a duplicate counterpart.
          </label>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800/70 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setMoveModalOpen(false)} disabled={moving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={moving || migrationOptionsLoading || Boolean(migrationOptionsError)}
            >
              <MoveRight className="h-4 w-4" aria-hidden="true" />
              {moving ? "Moving..." : moveForm.copy ? "Copy transaction(s)" : "Move transaction(s)"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
