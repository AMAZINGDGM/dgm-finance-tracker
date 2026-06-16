import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 shadow-glow hover:from-cyan-300 hover:via-sky-300 hover:to-indigo-400 focus-visible:ring-accent-soft",
  secondary:
    "border border-slate-700 bg-slate-950/75 text-slate-100 hover:border-accent/50 hover:bg-slate-900 hover:text-white",
  ghost: "text-slate-300 hover:bg-sky/10 hover:text-cyan-100",
  danger:
    "border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 focus-visible:ring-red-400"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        suppressHydrationWarning
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
