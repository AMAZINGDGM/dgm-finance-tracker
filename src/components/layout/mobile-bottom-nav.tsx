"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon } from "@/components/icons/app-icon";
import { useDftPreferences } from "@/lib/hooks/use-dft-preferences";
import { localizeNavigationItems, mobileNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { language } = useDftPreferences();
  const localizedMobileNavigation = localizeNavigationItems(mobileNavigation, language);

  return (
    <nav className="app-shell-chrome fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-panel/95 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {localizedMobileNavigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isAdd = item.icon === "CirclePlus";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-transparent text-xs font-medium text-slate-500 transition duration-200 ease-out active:scale-95",
                active
                  ? "border-accent/25 bg-sky/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.08)]"
                  : "hover:bg-slate-800/70 hover:text-white",
                isAdd &&
                  "text-cyan-100 [&>svg]:h-6 [&>svg]:w-6",
                isAdd &&
                  active &&
                  "border-accent/40 bg-gradient-to-br from-cyan-400/20 to-indigo-500/20"
              )}
            >
              <AppIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
