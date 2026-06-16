import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "green" | "red" | "blue" | "warning" | "slate";

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-accent/35 bg-accent/10 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.08)]",
  green: "border-income/30 bg-income/10 text-green-300",
  red: "border-expense/30 bg-expense/10 text-red-300",
  blue: "border-sky/30 bg-sky/10 text-sky-200",
  warning: "border-warning/35 bg-warning/10 text-amber-200",
  slate: "border-slate-700 bg-slate-800/70 text-slate-300"
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
