"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DftLogo } from "@/components/brand/dft-logo";
import { AppIcon } from "@/components/icons/app-icon";
import { Badge } from "@/components/ui/badge";
import { useDftPreferences } from "@/lib/hooks/use-dft-preferences";
import { localizeNavigationItems, mainNavigation } from "@/lib/navigation";
import type { DftLanguage } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const sidebarCopy = {
  en: {
    aiReady: "AI-ready",
    naturalLanguageFinance: "Natural language finance",
    helper: "Bilingual AI parsing with confirm, edit, and cancel before saving."
  },
  id: {
    aiReady: "AI siap",
    naturalLanguageFinance: "Finansial bahasa natural",
    helper: "Parsing AI dua bahasa dengan konfirmasi, edit, dan batal sebelum disimpan."
  }
} satisfies Record<DftLanguage, Record<string, string>>;

export function Sidebar() {
  const pathname = usePathname();
  const { language } = useDftPreferences();
  const copy = sidebarCopy[language];
  const localizedMainNavigation = localizeNavigationItems(mainNavigation, language);

  return (
    <aside className="app-shell-chrome fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-800 bg-panel/95 px-4 py-5 backdrop-blur-xl lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-2xl px-2">
        <DftLogo size="sm" />
        <div>
          <p className="text-xl font-black text-white">DFT</p>
          <p className="text-xs text-muted">Dgm Finance Tracker</p>
        </div>
      </Link>

      <nav className="space-y-1">
        {localizedMainNavigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-slate-400 transition hover:border-accent/20 hover:bg-sky/10 hover:text-white",
                active &&
                  "border-accent/30 bg-slate-950/80 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18),0_0_28px_rgba(34,211,238,0.08)]"
              )}
            >
              <AppIcon
                name={item.icon}
                className={cn(
                  "h-5 w-5 text-slate-500 transition group-hover:text-accent-soft",
                  active && "text-accent-soft"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <Badge tone="accent">{copy.aiReady}</Badge>
        <p className="mt-3 text-sm font-semibold text-white">{copy.naturalLanguageFinance}</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          {copy.helper}
        </p>
      </div>
    </aside>
  );
}
