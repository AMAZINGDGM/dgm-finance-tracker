"use client";

import { Calculator, CheckSquare, Sparkles } from "lucide-react";

import { SmartCalculator } from "@/components/ai/smart-calculator";
import { RemindersPanel } from "@/components/ai/reminders-panel";
import { AIQuickInput } from "@/components/dashboard/ai-quick-input";
import { cn } from "@/lib/utils";

type CommandTab = "quick-add" | "calculator" | "reminders";

const tabs: { id: CommandTab; label: string; icon: typeof Sparkles }[] = [
  { id: "quick-add", label: "Quick Add", icon: Sparkles },
  { id: "calculator", label: "Smart Calculator", icon: Calculator },
  { id: "reminders", label: "Reminders", icon: CheckSquare }
];

type AICommandCenterProps = {
  activeTab: CommandTab;
  onTabChange: (tab: CommandTab) => void;
};

export function AICommandCenter({ activeTab, onTabChange }: AICommandCenterProps) {
  return (
    <div className="space-y-4">
      <div className="ai-command-tabs grid grid-cols-3 gap-1 rounded-2xl border border-slate-800/85 bg-slate-950/45 p-1">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              suppressHydrationWarning
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] px-2 text-xs font-bold text-slate-400 transition duration-200 hover:bg-sky/10 hover:text-white",
                active &&
                  "bg-gradient-to-r from-cyan-400/18 to-indigo-500/18 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.10)]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.id === "quick-add" ? "Add" : tab.id === "calculator" ? "Calc" : "Remind"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="ai-command-panel">
        {activeTab === "quick-add" ? <AIQuickInput surface="plain" /> : null}
        {activeTab === "calculator" ? <SmartCalculator /> : null}
        {activeTab === "reminders" ? <RemindersPanel /> : null}
      </div>
    </div>
  );
}
