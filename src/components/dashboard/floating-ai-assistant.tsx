"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { AICommandCenter } from "@/components/ai/ai-command-center";
import { FinanceAiRobotIcon } from "@/components/brand/finance-ai-robot-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick-add" | "calculator" | "reminders">(
    "quick-add"
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setOpen(true)}
        className={cn(
          "dashboard-ai-fab print-hidden group fixed right-4 z-40 flex h-12 w-12 items-center justify-center overflow-visible rounded-2xl border border-cyan-300/24 bg-[linear-gradient(145deg,rgba(2,6,23,0.94),rgba(8,13,30,0.92)_58%,rgba(15,23,42,0.80))] text-white shadow-[0_16px_44px_rgba(0,0,0,0.34),0_0_22px_rgba(34,211,238,0.15)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:scale-[1.025] hover:border-cyan-200/45 hover:shadow-[0_20px_60px_rgba(0,0,0,0.40),0_0_34px_rgba(34,211,238,0.24)] focus:outline-none focus:ring-2 focus:ring-cyan-300/45 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 sm:w-auto sm:gap-2 sm:px-2 sm:pr-3.5",
          "bottom-[calc(1.5rem+env(safe-area-inset-bottom))] lg:bottom-7 lg:right-7"
        )}
        aria-label="Open DFT AI Assistant"
        aria-expanded={open}
        title="Open DFT AI Assistant"
      >
        <span
          className="pointer-events-none absolute inset-x-2 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent opacity-80"
          aria-hidden="true"
        />
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-200/24 bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.30),transparent_40%),linear-gradient(145deg,rgba(8,47,73,0.46),rgba(15,23,42,0.96))] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_20px_rgba(34,211,238,0.18)]">
          <FinanceAiRobotIcon className="h-6 w-6 text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.32)]" />
        </span>
        <span className="relative hidden min-w-0 pr-0.5 text-left sm:block">
          <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100">
            DFT Copilot
          </span>
          <span className="block text-[10px] font-semibold leading-3 text-slate-400">Finance AI</span>
        </span>
      </button>

      {open ? (
        <div className="print-hidden fixed inset-0 z-50">
          <button
            type="button"
            suppressHydrationWarning
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
            aria-label="Close AI Assistant"
            onClick={() => setOpen(false)}
          />
          <aside className="dashboard-ai-panel absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 right-3 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.75rem] border border-accent/25 bg-[#050816]/95 p-4 shadow-[0_30px_110px_rgba(0,0,0,0.62),0_0_70px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:left-auto sm:right-5 sm:w-[520px] lg:bottom-5 lg:w-[560px]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
                  DFT Intelligence
                </p>
                <h2 className="mt-1 text-xl font-black text-white">AI Finance Command Center</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Quick add, calculate IDR decisions, and stage finance reminders.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close AI Assistant"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <AICommandCenter activeTab={activeTab} onTabChange={setActiveTab} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
