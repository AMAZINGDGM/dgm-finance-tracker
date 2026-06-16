import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function ReportsDashboardSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="reports-control-panel print-hidden rounded-[1.25rem] border border-slate-800/75 p-2">
        <div className="grid gap-2 2xl:grid-cols-[minmax(0,1fr)_minmax(440px,auto)] 2xl:items-center">
          <div>
            <LoadingSkeleton className="mb-2 h-3 w-32" />
            <div className="flex gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-1">
              {Array.from({ length: 4 }, (_, index) => (
                <LoadingSkeleton key={index} className="h-10 w-24 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/75 bg-slate-950/34 p-1.5">
            <LoadingSkeleton className="mb-2 h-3 w-20" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <LoadingSkeleton key={index} className="h-9 w-full rounded-xl xl:w-28" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="report-metric-card print-surface">
            <LoadingSkeleton className="h-4 w-28" />
            <LoadingSkeleton className="mt-4 h-8 w-36" />
            <LoadingSkeleton className="mt-3 h-4 w-32" />
          </Card>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_372px]">
        <Card className="dashboard-chart-card min-h-[290px] p-4">
          <CardHeader>
            <CardTitle>Preparing report charts</CardTitle>
          </CardHeader>
          <LoadingSkeleton className="h-48" />
        </Card>
        <Card className="reports-insight-card min-h-[290px] p-4">
          <CardHeader>
            <CardTitle>Preparing executive insight</CardTitle>
          </CardHeader>
          <LoadingSkeleton className="h-48" />
        </Card>
      </section>
    </div>
  );
}
