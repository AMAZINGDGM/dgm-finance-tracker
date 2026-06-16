import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/format";
import { dashboardSummary } from "@/lib/finance/mock-data";

export function PrintableReport() {
  return (
    <Card className="print-surface">
      <div className="border-b border-slate-800 pb-4">
        <p className="text-sm font-semibold text-accent-soft">DFT</p>
        <h1 className="mt-1 text-2xl font-black text-white">Dgm Finance Tracker Report</h1>
        <p className="mt-1 text-sm text-muted">Generated from the personal finance dashboard.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted">Income</p>
          <p className="mt-1 text-lg font-bold text-white">
            {formatCurrency(dashboardSummary.monthlyIncome)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Expense</p>
          <p className="mt-1 text-lg font-bold text-white">
            {formatCurrency(dashboardSummary.monthlyExpense)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Net savings</p>
          <p className="mt-1 text-lg font-bold text-white">
            {formatCurrency(dashboardSummary.netSavings)}
          </p>
        </div>
      </div>
    </Card>
  );
}
