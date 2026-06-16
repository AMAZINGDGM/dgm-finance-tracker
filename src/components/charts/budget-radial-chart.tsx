"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useMounted } from "@/lib/hooks/use-mounted";

type BudgetRadialChartProps = {
  value?: number;
  title?: string;
};

export function BudgetRadialChart({ value = 68, title = "Budget Progress" }: BudgetRadialChartProps) {
  const mounted = useMounted();
  const clampedValue = Math.max(0, Math.min(100, value));
  const fillColor = value >= 100 ? "#F43F5E" : value >= 75 ? "#F59E0B" : "#38BDF8";

  return (
    <Card className="dashboard-chart-card min-h-[280px] overflow-hidden">
      <CardHeader className="items-start">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Monthly limit usage across active budgets.</CardDescription>
        </div>
      </CardHeader>
      {mounted ? (
        <div className="dashboard-chart-reveal relative h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="72%"
              outerRadius="92%"
              data={[{ name: "budget", value: clampedValue, fill: fillColor }]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={14}
                background={{ fill: "rgba(30,41,59,0.72)" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-black text-white">{Math.round(value)}%</span>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-muted">
                Used
              </p>
            </div>
          </div>
        </div>
      ) : (
        <LoadingSkeleton className="h-48" />
      )}
    </Card>
  );
}
