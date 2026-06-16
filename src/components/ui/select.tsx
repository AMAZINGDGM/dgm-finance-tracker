import * as React from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        suppressHydrationWarning
        className={cn(
          "h-11 w-full cursor-pointer rounded-xl border border-slate-700/85 bg-slate-950/62 px-3 text-sm text-white outline-none transition hover:border-accent/30 hover:bg-slate-950/72 focus:border-accent/70 focus:ring-2 focus:ring-accent-soft/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
