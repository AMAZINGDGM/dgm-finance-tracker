"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppIcon } from "@/components/icons/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Select } from "@/components/ui/select";
import { requestJson } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/entities";
import type { CategoryType } from "@/types/finance";

type CategoryFormState = {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

export type CategoryStats = {
  expense: number;
  income: number;
  total: number;
};

type Language = "en" | "id";

type CategoriesManagerProps = {
  language?: Language;
  onStatsChange?: (stats: CategoryStats) => void;
};

const emptyForm: CategoryFormState = {
  name: "",
  type: "expense",
  color: "#38BDF8",
  icon: "Tags"
};

const iconOptions = [
  "Tags",
  "Utensils",
  "Wallet",
  "HandCoins",
  "Briefcase",
  "ShoppingBag",
  "ReceiptText",
  "CalendarDays",
  "Gift",
  "Sparkles"
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
  "h-12 rounded-2xl border-cyan-400/15 bg-[#050816]/78 px-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_34px_rgba(0,0,0,0.18)] placeholder:text-slate-500/70 hover:border-cyan-300/28 hover:bg-slate-950/82 focus:border-cyan-300/55 focus:bg-[#050816]/90 focus:ring-accent-soft/20";

const categoriesCopy = {
  en: {
    add: "Add category",
    addTitle: "Add Category",
    added: "Category added.",
    cancelEdit: "Cancel edit",
    categoryName: "Category Name",
    colorAria: "Category color hex value",
    colorIdentity: "Color Identity",
    confirmDelete: (name: string) =>
      `Delete ${name}? Existing transactions keep working but lose this category label.`,
    delete: "Delete",
    deleted: "Category deleted.",
    deleteError: "Could not delete category.",
    description: "Compact labels for reports, filters, and AI parsing.",
    edit: "Edit",
    editTitle: "Edit Category",
    expense: "Expense",
    expenseCount: (count: number) => `${count} expense`,
    formLabel: "Category Setup",
    icon: "Icon",
    iconPrefix: "Icon",
    income: "Income",
    incomeCount: (count: number) => `${count} income`,
    loadError: "Could not load categories.",
    managementDescription: (income: number, expense: number) =>
      `${income} income labels and ${expense} expense labels.`,
    managementLabel: "Category Management",
    managementTitle: "Categories",
    moneyIn: "Money in",
    moneyOut: "Money out",
    namePlaceholder: "Food & Drinks",
    noCategories: "No categories yet",
    noCategoriesDescription:
      "Create income and expense labels to unlock cleaner dashboards and reports.",
    saving: "Saving...",
    saveError: "Could not save category.",
    totalCount: (count: number) => `${count} total`,
    type: "Type",
    update: "Update category",
    updated: "Category updated.",
    useColor: (color: string) => `Use ${color}`
  },
  id: {
    add: "Tambah kategori",
    addTitle: "Tambah Kategori",
    added: "Kategori ditambahkan.",
    cancelEdit: "Batalkan edit",
    categoryName: "Nama Kategori",
    colorAria: "Nilai warna hex kategori",
    colorIdentity: "Identitas Warna",
    confirmDelete: (name: string) =>
      `Hapus ${name}? Transaksi lama tetap berjalan, tetapi label kategori ini akan hilang.`,
    delete: "Hapus",
    deleted: "Kategori dihapus.",
    deleteError: "Kategori tidak dapat dihapus.",
    description: "Label ringkas untuk laporan, filter, dan parsing AI.",
    edit: "Ubah",
    editTitle: "Ubah Kategori",
    expense: "Pengeluaran",
    expenseCount: (count: number) => `${count} pengeluaran`,
    formLabel: "Pengaturan Kategori",
    icon: "Ikon",
    iconPrefix: "Ikon",
    income: "Pemasukan",
    incomeCount: (count: number) => `${count} pemasukan`,
    loadError: "Kategori tidak dapat dimuat.",
    managementDescription: (income: number, expense: number) =>
      `${income} label pemasukan dan ${expense} label pengeluaran.`,
    managementLabel: "Manajemen Kategori",
    managementTitle: "Kategori",
    moneyIn: "Uang masuk",
    moneyOut: "Uang keluar",
    namePlaceholder: "Makan & Minum",
    noCategories: "Belum ada kategori",
    noCategoriesDescription:
      "Buat label pemasukan dan pengeluaran untuk membuka dasbor dan laporan yang lebih rapi.",
    saving: "Menyimpan...",
    saveError: "Kategori tidak dapat disimpan.",
    totalCount: (count: number) => `${count} total`,
    type: "Tipe",
    update: "Perbarui kategori",
    updated: "Kategori diperbarui.",
    useColor: (color: string) => `Gunakan ${color}`
  }
} satisfies Record<
  Language,
  {
    add: string;
    addTitle: string;
    added: string;
    cancelEdit: string;
    categoryName: string;
    colorAria: string;
    colorIdentity: string;
    confirmDelete: (name: string) => string;
    delete: string;
    deleted: string;
    deleteError: string;
    description: string;
    edit: string;
    editTitle: string;
    expense: string;
    expenseCount: (count: number) => string;
    formLabel: string;
    icon: string;
    iconPrefix: string;
    income: string;
    incomeCount: (count: number) => string;
    loadError: string;
    managementDescription: (income: number, expense: number) => string;
    managementLabel: string;
    managementTitle: string;
    moneyIn: string;
    moneyOut: string;
    namePlaceholder: string;
    noCategories: string;
    noCategoriesDescription: string;
    saving: string;
    saveError: string;
    totalCount: (count: number) => string;
    type: string;
    update: string;
    updated: string;
    useColor: (color: string) => string;
  }
>;

function colorToRgba(value: string | null | undefined, alpha: number) {
  const color = value && /^#[0-9A-F]{6}$/i.test(value) ? value : "#38BDF8";
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getTypeMeta(type: CategoryType | string, copy: (typeof categoriesCopy)[Language]) {
  if (type === "income") {
    return {
      badgeTone: "green" as const,
      label: copy.income,
      lineClass: "from-green-300/55 via-cyan-300/35 to-transparent",
      subtitle: copy.moneyIn
    };
  }

  return {
    badgeTone: "red" as const,
    label: copy.expense,
    lineClass: "from-rose-400/55 via-cyan-300/25 to-transparent",
    subtitle: copy.moneyOut
  };
}

export function CategoriesManager({ language = "en", onStatsChange }: CategoriesManagerProps) {
  const copy = categoriesCopy[language];
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(
    () => ({
      income: categories.filter((category) => category.type === "income"),
      expense: categories.filter((category) => category.type === "expense")
    }),
    [categories]
  );

  useEffect(() => {
    onStatsChange?.({
      expense: grouped.expense.length,
      income: grouped.income.length,
      total: categories.length
    });
  }, [categories.length, grouped.expense.length, grouped.income.length, onStatsChange]);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await requestJson<{ categories: Category[] }>("/api/categories");
      setCategories(data.categories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      type: category.type as CategoryType,
      color: category.color ?? "#38BDF8",
      icon: category.icon ?? "Tags"
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await requestJson<{ category: Category }>(`/api/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form)
        });
        toast.success(copy.updated);
      } else {
        await requestJson<{ category: Category }>("/api/categories", {
          method: "POST",
          body: JSON.stringify(form)
        });
        toast.success(copy.added);
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(copy.confirmDelete(category.name));

    if (!confirmed) {
      return;
    }

    try {
      await requestJson<{ ok: true }>(`/api/categories/${category.id}`, {
        method: "DELETE"
      });
      toast.success(copy.deleted);
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.deleteError);
    }
  }

  return (
    <section className="grid items-start gap-3 xl:grid-cols-[390px_minmax(0,1fr)]">
        <Card className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.78),rgba(15,23,42,0.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-3.5">
          <div className="pointer-events-none absolute -right-12 -top-14 h-28 w-28 rounded-full bg-cyan-300/5 blur-3xl" />
          <div className="mb-3 rounded-2xl border border-cyan-400/10 bg-slate-950/42 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/80">
                  {copy.formLabel}
                </p>
                <CardTitle className="mt-1 text-xl font-black tracking-tight">
                  {editingId ? copy.editTitle : copy.addTitle}
                </CardTitle>
                <CardDescription>
                  {copy.description}
                </CardDescription>
              </div>
              {editingId ? (
                <Button variant="ghost" size="icon" onClick={resetForm} aria-label={copy.cancelEdit}>
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>

          <form className="space-y-2.5" onSubmit={handleSubmit}>
            <label className="block">
              <span className={fieldLabelClass}>{copy.categoryName}</span>
              <Input
                className={controlClass}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={copy.namePlaceholder}
                required
              />
            </label>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabelClass}>{copy.type}</span>
                <Select
                  className={`${controlClass} appearance-none`}
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value as CategoryType }))
                  }
                >
                  <option value="income">{copy.income}</option>
                  <option value="expense">{copy.expense}</option>
                </Select>
              </label>
              <label className="block">
                <span className={fieldLabelClass}>{copy.icon}</span>
                <Select
                  className={`${controlClass} appearance-none`}
                  value={form.icon}
                  onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div>
              <span className={fieldLabelClass}>{copy.colorIdentity}</span>
              <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/42 p-2">
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8 xl:grid-cols-8">
                  {colorOptions.map((color) => {
                    const isSelected = form.color.toLowerCase() === color.toLowerCase();

                    return (
                      <button
                        key={color}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setForm((current) => ({ ...current, color }))}
                        className={cn(
                          "h-8 rounded-xl border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-300/24 motion-reduce:hover:translate-y-0",
                          isSelected
                            ? "border-white/70 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                            : "border-white/10"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={copy.useColor(color)}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 grid grid-cols-[42px_minmax(0,1fr)] gap-2.5">
                  <div
                    className="rounded-xl border border-white/10 shadow-[0_0_24px_rgba(34,211,238,0.10)]"
                    style={{ backgroundColor: form.color }}
                    aria-hidden="true"
                  />
                  <Input
                    className={controlClass}
                    value={form.color}
                    onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                    placeholder="#38BDF8"
                    aria-label={copy.colorAria}
                  />
                </div>
              </div>
            </div>

            <Button className="mt-1 w-full" type="submit" disabled={saving}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? copy.saving : editingId ? copy.update : copy.add}
            </Button>
          </form>
        </Card>

        <Card className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.76),rgba(15,23,42,0.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-3.5">
          <div className="pointer-events-none absolute -right-12 -top-14 h-28 w-28 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="mb-3 rounded-2xl border border-cyan-400/10 bg-slate-950/42 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/80">
                  {copy.managementLabel}
                </p>
                <CardTitle className="mt-1 text-xl font-black tracking-tight">
                  {copy.managementTitle}
                </CardTitle>
                <CardDescription>
                  {copy.managementDescription(grouped.income.length, grouped.expense.length)}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">{copy.incomeCount(grouped.income.length)}</Badge>
                <Badge tone="red">{copy.expenseCount(grouped.expense.length)}</Badge>
                <Badge tone="accent">{copy.totalCount(categories.length)}</Badge>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-[1.2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_48%),rgba(2,6,23,0.52)] p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/18 bg-cyan-300/8 text-cyan-200">
                <Tags className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-3 text-lg font-black text-white">{copy.noCategories}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
                {copy.noCategoriesDescription}
              </p>
            </div>
          ) : (
            <div className="grid items-start gap-2.5 lg:grid-cols-2">
              {(["income", "expense"] as const).map((type) => {
                const meta = getTypeMeta(type, copy);

                return (
                  <div key={type} className="rounded-[1.2rem] border border-cyan-400/10 bg-slate-950/30 p-2">
                    <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/42 p-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                          {meta.label}
                        </p>
                        <p className="text-sm text-muted">{meta.subtitle}</p>
                      </div>
                      <Badge tone={meta.badgeTone}>{grouped[type].length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {grouped[type].map((category) => {
                        const accent = category.color ?? "#38BDF8";
                        const categoryMeta = getTypeMeta(category.type, copy);

                        return (
                          <div
                            key={category.id}
                            className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/48 p-2 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/28 hover:bg-slate-950/66 hover:shadow-[0_14px_40px_rgba(34,211,238,0.06)] motion-reduce:hover:translate-y-0"
                          >
                            <div
                              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${categoryMeta.lineClass}`}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div
                                  className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 shadow-[0_0_26px_rgba(34,211,238,0.05)]"
                                  style={{
                                    backgroundColor: colorToRgba(accent, 0.14),
                                    color: accent
                                  }}
                                >
                                  <AppIcon name={category.icon ?? "Tags"} className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-black text-white">{category.name}</p>
                                  <p className="truncate text-xs text-muted">
                                    {copy.iconPrefix}: {category.icon ?? "Tags"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                <Badge tone={categoryMeta.badgeTone}>{categoryMeta.label}</Badge>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startEdit(category)}
                                  className="h-7 border-cyan-300/12 bg-slate-950/52 px-2 text-xs text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-300/8"
                                >
                                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                                  {copy.edit}
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => void deleteCategory(category)}
                                  className="h-7 border-expense/16 bg-expense/5 px-2 text-xs text-red-200/85 hover:border-expense/45 hover:bg-expense/15 hover:text-red-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  {copy.delete}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
    </section>
  );
}
