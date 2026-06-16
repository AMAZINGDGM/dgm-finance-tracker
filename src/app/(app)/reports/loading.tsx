import { ReportsDashboardSkeleton } from "@/components/reports/reports-dashboard-skeleton";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-3">
      <div className="reports-hero dashboard-enter print-hidden relative overflow-hidden rounded-[1.35rem] border border-slate-800/70 p-3 shadow-[0_14px_46px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-3.5">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <LoadingSkeleton className="h-4 w-44 rounded-full" />
            <LoadingSkeleton className="mt-1.5 h-10 w-full max-w-sm" />
            <LoadingSkeleton className="mt-1.5 h-5 w-full max-w-3xl" />
            <LoadingSkeleton className="mt-2.5 h-8 w-full max-w-2xl rounded-full" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <LoadingSkeleton className="h-14 rounded-2xl" />
            <LoadingSkeleton className="h-14 rounded-2xl" />
            <LoadingSkeleton className="h-14 rounded-2xl" />
          </div>
        </div>
      </div>
      <ReportsDashboardSkeleton />
    </div>
  );
}
