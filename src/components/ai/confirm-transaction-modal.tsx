"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";

import { AITransactionPreview } from "@/components/ai/ai-transaction-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/finance/format";
import { requestJson } from "@/lib/finance/client-api";
import type { Account, Category, Transaction } from "@/types/entities";
import type { ParsedTransaction, TransactionType } from "@/types/finance";

type ConfirmTransactionModalProps = {
  open: boolean;
  parsed: ParsedTransaction | null;
  onClose: () => void;
  onSaved?: () => void;
};

type PreviewForm = {
  type: TransactionType;
  amount: string;
  category_id: string;
  account_id: string;
  transfer_from_account_id: string;
  transfer_to_account_id: string;
  date: string;
  note: string;
};

function findIdByName<T extends { id: string; name: string }>(items: T[], name?: string | null) {
  if (!name) {
    return "";
  }

  return (
    items.find((item) => item.name.toLowerCase() === name.toLowerCase())?.id ??
    ""
  );
}

function buildForm(parsed: ParsedTransaction, accounts: Account[], categories: Category[]): PreviewForm {
  return {
    type: parsed.type,
    amount: parsed.amount ? String(parsed.amount) : "",
    category_id:
      parsed.category_id ??
      findIdByName(
        categories.filter((category) => category.type === parsed.type),
        parsed.category
      ),
    account_id: parsed.account_id ?? findIdByName(accounts, parsed.account) ?? "",
    transfer_from_account_id:
      parsed.transfer_from_account_id ?? findIdByName(accounts, parsed.transfer_from_account),
    transfer_to_account_id:
      parsed.transfer_to_account_id ?? findIdByName(accounts, parsed.transfer_to_account),
    date: parsed.date ?? new Date().toISOString().slice(0, 10),
    note: parsed.note ?? parsed.rawMessage ?? ""
  };
}

export function ConfirmTransactionModal({
  open,
  parsed,
  onClose,
  onSaved
}: ConfirmTransactionModalProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<PreviewForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoadingOptions(true);
    Promise.all([
      requestJson<{ accounts: Account[] }>("/api/accounts"),
      requestJson<{ categories: Category[] }>("/api/categories")
    ])
      .then(([accountsData, categoriesData]) => {
        setAccounts(accountsData.accounts);
        setCategories(categoriesData.categories);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load accounts and categories for AI preview."
        );
      })
      .finally(() => setLoadingOptions(false));
  }, [open]);

  useEffect(() => {
    if (!parsed || !open) {
      setForm(null);
      setEditing(false);
      return;
    }

    setForm(buildForm(parsed, accounts, categories));
    setEditing(Boolean(parsed.clarificationQuestion));
  }, [accounts, categories, open, parsed]);

  const matchingCategories = useMemo(() => {
    if (!form || form.type === "transfer") {
      return [];
    }

    return categories.filter((category) => category.type === form.type);
  }, [categories, form]);

  const preview = useMemo<ParsedTransaction | null>(() => {
    if (!parsed || !form) {
      return parsed;
    }

    const category = categories.find((item) => item.id === form.category_id);
    const account = accounts.find((item) => item.id === form.account_id);
    const fromAccount = accounts.find((item) => item.id === form.transfer_from_account_id);
    const toAccount = accounts.find((item) => item.id === form.transfer_to_account_id);

    return {
      ...parsed,
      type: form.type,
      amount: Number(form.amount || 0),
      category: form.type === "transfer" ? undefined : category?.name ?? parsed.category,
      category_id: form.type === "transfer" ? null : form.category_id || null,
      account: form.type === "transfer" ? undefined : account?.name ?? parsed.account,
      account_id: form.type === "transfer" ? null : form.account_id || null,
      transfer_from_account: form.type === "transfer" ? fromAccount?.name : undefined,
      transfer_from_account_id: form.type === "transfer" ? form.transfer_from_account_id || null : null,
      transfer_to_account: form.type === "transfer" ? toAccount?.name : undefined,
      transfer_to_account_id: form.type === "transfer" ? form.transfer_to_account_id || null : null,
      date: form.date,
      note: form.note,
      clarificationQuestion: canConfirm(form)
        ? undefined
        : parsed.clarificationQuestion ?? "Please complete the required fields before confirming."
    };
  }, [accounts, categories, form, parsed]);

  function canConfirm(currentForm: PreviewForm | null) {
    if (!currentForm || !Number(currentForm.amount) || !currentForm.date) {
      return false;
    }

    if (currentForm.type === "transfer") {
      return Boolean(
        currentForm.transfer_from_account_id &&
          currentForm.transfer_to_account_id &&
          currentForm.transfer_from_account_id !== currentForm.transfer_to_account_id
      );
    }

    return Boolean(currentForm.account_id);
  }

  function buildPayload() {
    if (!form) {
      return null;
    }

    const base = {
      type: form.type,
      amount: Number(form.amount),
      date: form.date,
      note: form.note.trim() ? form.note.trim() : null,
      source: "ai" as const
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

  async function saveConfirmedTransaction() {
    if (!canConfirm(form)) {
      setEditing(true);
      toast.error("Complete the required fields before confirming.");
      return;
    }

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setSaving(true);
    try {
      await requestJson<{ transaction: Transaction }>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      toast.success("AI transaction saved.");
      onSaved?.();
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save AI transaction.");
    } finally {
      setSaving(false);
    }
  }

  function updateForm<K extends keyof PreviewForm>(key: K, value: PreviewForm[K]) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      if (key === "type") {
        return {
          ...current,
          type: value as TransactionType,
          category_id: "",
          account_id: "",
          transfer_from_account_id: "",
          transfer_to_account_id: ""
        };
      }

      return { ...current, [key]: value };
    });
  }

  return (
    <Modal open={open} title="Confirm AI transaction" onClose={onClose} className="max-w-2xl">
      {!preview || !form ? (
        <p className="text-sm text-muted">No transaction preview yet.</p>
      ) : editing ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-accent/20 bg-sky/10 p-4 text-sm text-slate-200">
            Review and edit the Smart Capture preview before saving. Nothing is saved until you click Confirm.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Type</span>
              <Select
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value as TransactionType)}
              >
                <option value="expense">expense</option>
                <option value="income">income</option>
                <option value="transfer">transfer</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Amount</span>
              <Input
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                required
              />
            </label>
          </div>

          {form.type === "transfer" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">From account</span>
                <Select
                  value={form.transfer_from_account_id}
                  onChange={(event) => updateForm("transfer_from_account_id", event.target.value)}
                >
                  <option value="">Choose source</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">To account</span>
                <Select
                  value={form.transfer_to_account_id}
                  onChange={(event) => updateForm("transfer_to_account_id", event.target.value)}
                >
                  <option value="">Choose destination</option>
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
                <span className="mb-2 block text-sm text-slate-300">Category</span>
                <Select
                  value={form.category_id}
                  onChange={(event) => updateForm("category_id", event.target.value)}
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
                <span className="mb-2 block text-sm text-slate-300">Account</span>
                <Select
                  value={form.account_id}
                  onChange={(event) => updateForm("account_id", event.target.value)}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Date</span>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Note</span>
              <Input value={form.note} onChange={(event) => updateForm("note", event.target.value)} />
            </label>
          </div>

          <p className="text-xs text-muted">
            Preview amount: <span className="font-semibold text-white">{formatCurrency(Number(form.amount || 0))}</span>
            {loadingOptions ? " - loading account/category options..." : null}
          </p>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={saveConfirmedTransaction} disabled={saving || !canConfirm(form)}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : "Confirm"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Preview
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <AITransactionPreview
          parsed={preview}
          onConfirm={saveConfirmedTransaction}
          onEdit={() => setEditing(true)}
          onCancel={onClose}
          confirmDisabled={saving || !canConfirm(form)}
          confirmLabel={saving ? "Saving..." : "Confirm"}
        />
      )}
    </Modal>
  );
}
