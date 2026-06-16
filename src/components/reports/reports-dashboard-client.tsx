"use client";

import dynamic from "next/dynamic";

import { ReportsDashboardSkeleton } from "@/components/reports/reports-dashboard-skeleton";
import type { DashboardData } from "@/lib/finance/dashboard";
import type { ReportsData } from "@/lib/finance/reports";

type ReportsDashboardClientProps = {
  dashboard: DashboardData;
  reports: ReportsData;
};

const ReportsDashboard = dynamic<ReportsDashboardClientProps>(
  () =>
    import("@/components/reports/reports-dashboard").then(
      (module) => module.ReportsDashboard
    ),
  {
    loading: () => <ReportsDashboardSkeleton />,
    ssr: false
  }
);

export function ReportsDashboardClient(props: ReportsDashboardClientProps) {
  return <ReportsDashboard {...props} />;
}
