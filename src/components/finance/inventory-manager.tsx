"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Layers3,
  Package,
  PackagePlus,
  ShoppingCart,
  X
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/finance/format";
import { requestJson } from "@/lib/finance/client-api";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/entities";
import type { Workspace } from "@/lib/workspaces";

type ProductFormState = {
  name: string;
  brand: string;
  category: string;
  sku: string;
  cost_price: string;
  selling_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  condition: string;
  notes: string;
};

type InventoryManagerProps = {
  activeWorkspace: Workspace | null;
};

const emptyForm: ProductFormState = {
  name: "",
  brand: "",
  category: "",
  sku: "",
  cost_price: "",
  selling_price: "",
  stock_quantity: "0",
  low_stock_threshold: "1",
  condition: "",
  notes: ""
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
  tone?: "cyan" | "green" | "rose";
  value: string;
}) {
  const toneClass = {
    cyan: "border-accent/20 bg-sky/10 text-accent-soft",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200"
  }[tone];

  return (
    <Card className="dashboard-stat-card relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-muted">{helper}</p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl border", toneClass)}>
          {icon}
        </span>
      </div>
    </Card>
  );
}

export function InventoryManager({ activeWorkspace }: InventoryManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isBusinessWorkspace = activeWorkspace?.type === "business";

  const totalStockValue = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total + Number(product.cost_price ?? 0) * Number(product.stock_quantity ?? 0),
        0
      ),
    [products]
  );
  const lowStockItems = useMemo(
    () =>
      products.filter(
        (product) =>
          Number(product.stock_quantity ?? 0) <= Number(product.low_stock_threshold ?? 0)
      ).length,
    [products]
  );
  const soldItems = useMemo(
    () => products.reduce((total, product) => total + Number(product.sold_quantity ?? 0), 0),
    [products]
  );

  async function loadProducts() {
    if (!isBusinessWorkspace) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await requestJson<{ products: Product[] }>("/api/products");
      setProducts(data.products);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id, isBusinessWorkspace]);

  function openProductModal() {
    if (!isBusinessWorkspace) {
      toast.info("Inventory is available for business workspaces only.");
      return;
    }

    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    setSaving(true);
    try {
      const productPayload = {
        ...form,
        cost_price: toNumber(form.cost_price),
        selling_price: toNumber(form.selling_price),
        stock_quantity: toNumber(form.stock_quantity),
        low_stock_threshold: toNumber(form.low_stock_threshold)
      };

      await requestJson<{ product: Product }>("/api/products", {
        method: "POST",
        body: JSON.stringify(productPayload)
      });

      toast.success("Product added to inventory.");
      setModalOpen(false);
      setForm(emptyForm);
      await loadProducts();
    } catch (error) {
      console.error("[inventory:add-product]", error);
      toast.error(error instanceof Error ? error.message : "Could not save product.");
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
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              Stock Control
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Inventory
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Track product stock, cost, selling price, and stock movement.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={openProductModal}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Add Product
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
              Inventory belongs to your business workspace so product stock, value, and low-stock
              alerts do not mix with Personal Finance.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              helper="Product records"
              icon={<Package className="h-5 w-5" aria-hidden="true" />}
              label="Total Products"
              value={String(products.length)}
            />
            <SummaryCard
              helper="Cost x stock"
              icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
              label="Total Stock Value"
              tone="green"
              value={formatCurrency(totalStockValue)}
            />
            <SummaryCard
              helper="Need restock"
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              label="Low Stock Items"
              tone={lowStockItems > 0 ? "rose" : "cyan"}
              value={String(lowStockItems)}
            />
            <SummaryCard
              helper="Sales movement"
              icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
              label="Sold Items"
              value={String(soldItems)}
            />
          </section>

          <Card className="dashboard-chart-card overflow-hidden p-5">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-[1.35rem] border border-slate-800/70 bg-slate-950/52"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-accent/20 bg-slate-950/28 p-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/20 bg-sky/10 text-accent-soft">
                  <Package className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-black text-white">No products yet</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
                  Add your first product to start tracking stock, pricing, and business inventory
                  movement.
                </p>
                <Button className="mt-5" onClick={openProductModal}>
                  <PackagePlus className="h-4 w-4" aria-hidden="true" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-soft">
                      Product Ledger
                    </p>
                    <h2 className="mt-2 text-xl font-black text-white">Inventory list</h2>
                  </div>
                  <Button size="sm" onClick={openProductModal}>
                    <PackagePlus className="h-4 w-4" aria-hidden="true" />
                    Add Product
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const stock = Number(product.stock_quantity ?? 0);
                    const threshold = Number(product.low_stock_threshold ?? 0);
                    const lowStock = stock <= threshold;
                    const stockValue = Number(product.cost_price ?? 0) * stock;

                    return (
                      <article
                        key={product.id}
                        className="rounded-[1.35rem] border border-slate-800/70 bg-slate-950/48 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-accent/25"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-white">{product.name}</p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {[product.brand, product.category, product.sku].filter(Boolean).join(" / ") ||
                                "Uncategorized product"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                              lowStock
                                ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
                                : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                            )}
                          >
                            {lowStock ? "Low Stock" : "In Stock"}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/44 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                              Stock
                            </p>
                            <p className="mt-1 font-black text-white">{stock}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/44 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                              Value
                            </p>
                            <p className="mt-1 truncate font-black text-cyan-100">
                              {formatCurrency(stockValue)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                          <span>Cost {formatCurrency(Number(product.cost_price ?? 0))}</span>
                          <span>Sell {formatCurrency(Number(product.selling_price ?? 0))}</span>
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
        title="Add Product"
        onClose={() => setModalOpen(false)}
        className="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={fieldLabelClass}>Product Name</span>
              <Input
                className={controlClass}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Davenue Hoodie"
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Brand</span>
              <Input
                className={controlClass}
                value={form.brand}
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                placeholder="Davenue"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Category</span>
              <Input
                className={controlClass}
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Apparel"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>SKU / Product Code</span>
              <Input
                className={controlClass}
                value={form.sku}
                onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                placeholder="DVN-HDY-001"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Cost Price / Modal Price</span>
              <Input
                className={controlClass}
                inputMode="numeric"
                value={formatThousands(form.cost_price)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cost_price: sanitizeNumberInput(event.target.value) }))
                }
                placeholder="150.000"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Selling Price</span>
              <Input
                className={controlClass}
                inputMode="numeric"
                value={formatThousands(form.selling_price)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, selling_price: sanitizeNumberInput(event.target.value) }))
                }
                placeholder="250.000"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Stock Quantity</span>
              <Input
                className={controlClass}
                inputMode="numeric"
                value={form.stock_quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stock_quantity: sanitizeNumberInput(event.target.value)
                  }))
                }
                placeholder="10"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Low Stock Alert Threshold</span>
              <Input
                className={controlClass}
                inputMode="numeric"
                value={form.low_stock_threshold}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    low_stock_threshold: sanitizeNumberInput(event.target.value)
                  }))
                }
                placeholder="2"
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Condition</span>
              <Select
                className={controlClass}
                value={form.condition}
                onChange={(event) =>
                  setForm((current) => ({ ...current, condition: event.target.value }))
                }
              >
                <option value="">Optional</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Preorder">Preorder</option>
                <option value="Returned">Returned</option>
              </Select>
            </label>
            <label>
              <span className={fieldLabelClass}>Notes</span>
              <Input
                className={controlClass}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Supplier, size, variant, or stock note"
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800/70 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : "Save product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
