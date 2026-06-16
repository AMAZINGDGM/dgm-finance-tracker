import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="dashboard-enter space-y-4 pb-28 lg:pb-24 xl:pb-12">
      <section className="dashboard-hero relative overflow-hidden rounded-[1.75rem] border border-slate-800/70 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.30),0_0_34px_rgba(34,211,238,0.045)] sm:p-5 xl:p-6">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 flex-1">
            <LoadingSkeleton className="h-7 w-36 rounded-full" />
            <LoadingSkeleton className="mt-5 h-11 w-full max-w-xl" />
            <LoadingSkeleton className="mt-3 h-5 w-full max-w-2xl" />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:w-[620px] xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="dashboard-hero-metric rounded-[1.15rem] p-3">
                <LoadingSkeleton className="h-3 w-20" />
                <LoadingSkeleton className="mt-3 h-6 w-24" />
                <LoadingSkeleton className="mt-2 h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="dashboard-stat-card p-4">
            <LoadingSkeleton className="h-3 w-24" />
            <LoadingSkeleton className="mt-3 h-7 w-32" />
            <LoadingSkeleton className="mt-2 h-4 w-40" />
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.65fr)]">
        <Card className="dashboard-chart-card min-h-[320px]">
          <CardHeader>
            <CardTitle>Loading cashflow</CardTitle>
          </CardHeader>
          <LoadingSkeleton className="h-64" />
        </Card>
        <Card className="dashboard-chart-card min-h-[320px]">
          <CardHeader>
            <CardTitle>Loading categories</CardTitle>
          </CardHeader>
          <LoadingSkeleton className="h-64" />
        </Card>
      </section>
    </div>
  );
}
