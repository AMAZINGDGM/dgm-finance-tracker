import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        suppressHydrationWarning
        className={cn(
          "h-11 w-full rounded-xl border border-slate-700/85 bg-slate-950/62 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-accent/30 hover:bg-slate-950/72 focus:border-accent/70 focus:ring-2 focus:ring-accent-soft/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
