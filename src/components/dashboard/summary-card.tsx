import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "accent" | "green" | "red" | "blue" | "warning";
  trend?: string;
  featured?: boolean;
};

const toneClasses = {
  accent: "text-accent-soft bg-sky/10 border-accent/20",
  green: "text-green-300 bg-income/10 border-income/20",
  red: "text-red-300 bg-expense/10 border-expense/20",
  blue: "text-sky-200 bg-sky/10 border-sky/20",
  warning: "text-amber-200 bg-warning/10 border-warning/25"
};

export function SummaryCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "accent",
  trend,
  featured = false
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "dashboard-stat-card group relative overflow-hidden p-3.5 sm:p-4",
        featured && "sm:col-span-2 xl:col-span-1"
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 break-words text-lg font-black leading-tight tracking-tight text-white sm:text-xl">
            {value}
          </p>
          <p className="mt-1.5 break-words text-xs leading-5 text-slate-400">{helper}</p>
          {trend ? (
            <span className="mt-2 inline-flex rounded-full border border-slate-800/70 bg-slate-950/35 px-2.5 py-1 text-[10px] font-medium text-slate-400">
              {trend}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "shrink-0 rounded-xl border bg-slate-950/35 p-2.5 transition duration-200 group-hover:scale-105",
            toneClasses[tone]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
