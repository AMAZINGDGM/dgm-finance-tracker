import { BarChart3, CalendarDays, FileText, Sparkles } from "lucide-react";

import { ReportsDashboardClient } from "@/components/reports/reports-dashboard-client";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/finance/format";
import { getReportsDataset } from "@/lib/finance/server-reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { dashboard, reports } = await getReportsDataset();
  const direction =
    reports.monthly.netSavings >= 0
      ? "Positive savings direction"
      : "Spending is ahead of income";

  return (
    <div className="dashboard-enter space-y-3 pb-24 xl:pb-10">
      <section className="reports-hero print-hidden relative overflow-hidden rounded-[1.35rem] border border-slate-800/70 p-3 shadow-[0_14px_46px_rgba(0,0,0,0.26),0_0_22px_rgba(34,211,238,0.03)] sm:p-3.5">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="dashboard-hero-glow dashboard-hero-glow-one" aria-hidden="true" />
        <div className="dashboard-hero-glow dashboard-hero-glow-two" aria-hidden="true" />

        <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200/70">
              DFT Reporting Center
            </p>
            <h1 className="mt-0.5 max-w-4xl text-balance bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-[2.05rem] xl:text-[2.25rem]">
              Reports
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-300">
              Executive monthly and yearly finance reporting with clean PDF export, print-ready
              statements, budget signals, and decision-ready account intelligence.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="accent">PDF Ready</Badge>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800/90 bg-slate-950/42 px-3 py-1 text-xs font-semibold text-slate-300">
                <CalendarDays className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" />
                {reports.monthly.label}
              </span>
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-300/20 bg-slate-950/36 px-3 py-1 text-xs font-semibold text-slate-300">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-soft" aria-hidden="true" />
                <span className="truncate">
                  {direction}: {formatCurrency(reports.monthly.netSavings)} net this month
                </span>
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <div className="reports-hero-stat rounded-2xl p-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <FileText className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" />
                Active period
              </div>
              <p className="mt-1 text-sm font-black text-white">{reports.monthly.label}</p>
              <p className="text-[11px] text-muted">Generated {reports.generatedAt}</p>
            </div>
            <div className="reports-hero-stat rounded-2xl p-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <BarChart3 className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" />
                Year view
              </div>
              <p className="mt-1 text-sm font-black text-white">{reports.yearly.year}</p>
              <p className="text-[11px] text-muted">
                {formatCurrency(reports.yearly.savings)} yearly savings
              </p>
            </div>
            <div className="reports-hero-stat rounded-2xl p-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" />
                Report status
              </div>
              <p className="mt-1 text-sm font-black text-white">Ready</p>
              <p className="text-[11px] text-muted">PDF, print, and insight panels active</p>
            </div>
          </div>
        </div>
      </section>
      <ReportsDashboardClient dashboard={dashboard} reports={reports} />
    </div>
  );
}
