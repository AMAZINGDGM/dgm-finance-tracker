"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";

import { getCurrentMonthYear, monthNames } from "@/lib/finance/format";
import type { DftLanguage } from "@/lib/preferences";
import { cn } from "@/lib/utils";

type MonthSelectorProps = {
  className?: string;
  language?: DftLanguage;
};

const monthNamesByLanguage: Record<DftLanguage, string[]> = {
  en: monthNames,
  id: [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ]
};

const monthSelectorCopy = {
  en: {
    ariaLabel: "Month selector",
    period: "Period",
    selectMonth: "Select month",
    selectPeriod: "Select Period"
  },
  id: {
    ariaLabel: "Pemilih bulan",
    period: "Periode",
    selectMonth: "Pilih bulan",
    selectPeriod: "Pilih Periode"
  }
} satisfies Record<DftLanguage, Record<string, string>>;

export function MonthSelector({ className, language = "en" }: MonthSelectorProps) {
  const current = getCurrentMonthYear();
  const copy = monthSelectorCopy[language];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(`${current.month}-${current.year}`);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(
    () =>
      monthNamesByLanguage[language].map((month, index) => ({
        label: `${month} ${current.year}`,
        shortLabel: `${month.slice(0, 3)} ${current.year}`,
        value: `${index + 1}-${current.year}`
      })),
    [current.year, language]
  );
  const selectedOption = options.find((option) => option.value === selected) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="month-selector-trigger flex h-10 w-full items-center justify-between gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-2.5 text-left text-xs font-bold text-slate-100 shadow-[0_12px_34px_rgba(0,0,0,0.18)] outline-none transition hover:border-accent/25 hover:bg-slate-950/80 hover:shadow-[0_14px_42px_rgba(34,211,238,0.06)] focus-visible:ring-2 focus-visible:ring-accent/30"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={copy.ariaLabel}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-sky/10 text-cyan-200/80">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate">{selectedOption.shortLabel}</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 2xl:block">
              {copy.period}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-500 transition", open && "rotate-180 text-accent-soft")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          className="month-selector-menu absolute right-0 top-full z-50 mt-3 w-56 rounded-[1.25rem] border border-accent/20 bg-slate-950/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.50),0_0_34px_rgba(34,211,238,0.055)] backdrop-blur-2xl"
          role="listbox"
          aria-label={copy.selectMonth}
        >
          <div className="mb-2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {copy.selectPeriod}
            </p>
          </div>
          <div className="grid max-h-72 gap-1 overflow-y-auto pr-1 no-scrollbar">
            {options.map((option) => {
              const active = option.value === selected;

              return (
                <button
                  key={option.value}
                  type="button"
                  suppressHydrationWarning
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setSelected(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-sky/10 hover:text-white",
                    active &&
                      "bg-gradient-to-r from-cyan-400/20 to-indigo-500/20 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]"
                  )}
                >
                  <span>{option.label}</span>
                  {active ? <Check className="h-4 w-4 text-accent-soft" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
