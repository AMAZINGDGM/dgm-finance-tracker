import { Gauge } from "lucide-react";

import { Card } from "@/components/ui/card";
import { dashboardSummary } from "@/lib/finance/mock-data";

type BudgetStatusCardProps = {
  value?: number;
};

export function BudgetStatusCard({ value = dashboardSummary.budgetUsed }: BudgetStatusCardProps) {
  const used = Math.max(0, Math.min(100, value));
  const status =
    value >= 100 ? "Danger limit reached" : value >= 75 ? "Warning level" : "Healthy range";
  const statusClass =
    value >= 100 ? "text-red-300" : value >= 75 ? "text-amber-200" : "text-accent-soft";
  const progressClass =
    value >= 100
      ? "bg-expense"
      : value >= 75
        ? "bg-warning"
        : "bg-gradient-to-r from-cyan-400 to-indigo-500";

  return (
    <Card className="dashboard-secondary-card overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Budget Status
          </p>
          <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
            {Math.round(value)}% used
          </h2>
          <p className={`mt-1 text-xs font-medium ${statusClass}`}>{status}</p>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-sky/10 p-2.5 text-accent-soft shadow-[0_0_24px_rgba(34,211,238,0.08)]">
          <Gauge className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800/90">
        <div
          className={`h-2.5 rounded-full shadow-[0_0_24px_rgba(34,211,238,0.14)] ${progressClass}`}
          style={{ width: `${used}%` }}
        />
      </div>
      <p className="mt-2.5 text-xs leading-5 text-muted">
        Warning starts at 75%. Danger starts at 100%.
      </p>
    </Card>
  );
}
