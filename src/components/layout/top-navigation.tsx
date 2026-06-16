"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { DftLogo } from "@/components/brand/dft-logo";
import { AppIcon } from "@/components/icons/app-icon";
import { MonthSelector } from "@/components/layout/month-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import {
  businessTopMoreNavigation,
  businessTopNavigation,
  businessTopPrimaryNavigation,
  localizeNavigationItems,
  topMoreNavigation,
  topNavigation,
  topPrimaryNavigation
} from "@/lib/navigation";
import {
  preferencesChangedEvent,
  preferencesKey,
  readPreferencesFromStorage,
  type DftLanguage,
  type DftPreferences
} from "@/lib/preferences";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/workspaces";

export type TopNavigationProps = {
  activeWorkspaceId?: string | null;
  isSupabaseReady: boolean;
  userName: string;
  workspaces?: Workspace[];
};

const topNavigationCopy = {
  en: {
    closeMenu: "Close navigation menu",
    connect: "Connect",
    logout: "Logout",
    mainNavigation: "Main navigation",
    mobileNavigation: "Mobile navigation",
    more: "More",
    openMenu: "Open navigation menu",
    profileWorkspace: "Profile workspace",
    search: "Search...",
    searchFinance: "Search finance data...",
    setup: "Setup",
    setupNeeded: "Supabase setup needed",
    addBusiness: "Add Business Workspace",
    supabaseNotConnected: "Supabase is not connected yet.",
    workspace: "Workspace"
  },
  id: {
    closeMenu: "Tutup menu navigasi",
    connect: "Hubungkan",
    logout: "Keluar",
    mainNavigation: "Navigasi utama",
    mobileNavigation: "Navigasi mobile",
    more: "Lainnya",
    openMenu: "Buka menu navigasi",
    profileWorkspace: "Workspace profil",
    search: "Cari...",
    searchFinance: "Cari data finansial...",
    setup: "Setup",
    setupNeeded: "Setup Supabase diperlukan",
    addBusiness: "Tambah workspace bisnis",
    supabaseNotConnected: "Supabase belum terhubung.",
    workspace: "Workspace"
  }
} satisfies Record<DftLanguage, Record<string, string>>;

export function TopNavigation({
  activeWorkspaceId,
  isSupabaseReady,
  userName,
  workspaces = []
}: TopNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"business" | "personal">(
    workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.type === "business"
      ? "business"
      : "personal"
  );
  const [language, setLanguage] = useState<DftLanguage>("en");
  const copy = topNavigationCopy[language];
  const primaryNavigation =
    workspaceMode === "business" ? businessTopPrimaryNavigation : topPrimaryNavigation;
  const moreNavigation =
    workspaceMode === "business" ? businessTopMoreNavigation : topMoreNavigation;
  const fullNavigation = workspaceMode === "business" ? businessTopNavigation : topNavigation;
  const localizedPrimaryNavigation = localizeNavigationItems(
    primaryNavigation,
    language,
    workspaceMode
  );
  const localizedMoreNavigation = localizeNavigationItems(moreNavigation, language, workspaceMode);
  const localizedTopNavigation = localizeNavigationItems(fullNavigation, language, workspaceMode);
  const profileName = isSupabaseReady ? userName : copy.setup;
  const profileSubtitle = isSupabaseReady ? copy.workspace : copy.connect;
  const profileInitial = profileName.slice(0, 1).toUpperCase();
  const moreActive = localizedMoreNavigation.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  useEffect(() => {
    setLanguage(readPreferencesFromStorage().language);

    function handlePreferencesChange(event: Event) {
      const detail = (event as CustomEvent<DftPreferences>).detail;
      setLanguage(detail?.language ?? readPreferencesFromStorage().language);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === preferencesKey) {
        setLanguage(readPreferencesFromStorage().language);
      }
    }

    window.addEventListener(preferencesChangedEvent, handlePreferencesChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(preferencesChangedEvent, handlePreferencesChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      toast.info(copy.supabaseNotConnected);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const prefetchRoute = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  const prefetchSecondaryRoutes = useCallback(() => {
    localizedMoreNavigation.forEach((item) => prefetchRoute(item.href));
  }, [localizedMoreNavigation, prefetchRoute]);

  return (
    <header className="top-navigation app-shell-chrome sticky top-0 z-40 max-w-full overflow-visible border-b border-accent/10 bg-background/80 px-4 py-2.5 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-[1520px]">
        <div className="hidden min-h-14 min-w-0 items-center gap-3 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] 2xl:gap-5">
          <Link
            href="/dashboard"
            prefetch
            onMouseEnter={() => prefetchRoute("/dashboard")}
            onFocus={() => prefetchRoute("/dashboard")}
            className="group flex w-[176px] min-w-0 shrink-0 items-center gap-3 justify-self-start rounded-2xl pr-3 transition hover:opacity-95 2xl:w-[232px]"
            aria-label="DFT dashboard"
          >
            <DftLogo size="sm" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white">DFT</p>
              <p className="truncate text-xs text-muted">Dgm Finance Tracker</p>
            </div>
          </Link>

          <nav
            className="top-navigation-menu mx-auto flex min-w-0 max-w-full items-center justify-center gap-1 justify-self-center 2xl:gap-2"
            aria-label={copy.mainNavigation}
          >
            {localizedPrimaryNavigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.id ?? item.href}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn("top-navigation-link", active && "top-navigation-link-active")}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="relative">
              <button
                type="button"
                suppressHydrationWarning
                className={cn(
                  "top-navigation-link gap-1.5",
                  moreActive && "top-navigation-link-active"
                )}
                onClick={() => setMoreOpen((currentOpen) => !currentOpen)}
                onMouseEnter={prefetchSecondaryRoutes}
                onFocus={prefetchSecondaryRoutes}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                {copy.more}
                <ChevronDown
                  className={cn("h-4 w-4 transition", moreOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {moreOpen ? (
                <div className="top-navigation-more-menu absolute left-1/2 top-full z-50 mt-3 w-56 -translate-x-1/2 rounded-[1.25rem] border border-accent/20 bg-slate-950/95 p-2 shadow-[0_24px_90px_rgba(0,0,0,0.50),0_0_38px_rgba(34,211,238,0.08)] backdrop-blur-2xl">
                  {localizedMoreNavigation.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.id ?? item.href}
                        href={item.href}
                        prefetch
                        onMouseEnter={() => prefetchRoute(item.href)}
                        onFocus={() => prefetchRoute(item.href)}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-sky/10 hover:text-white",
                          active && "bg-sky/10 text-cyan-100"
                        )}
                      >
                        <AppIcon
                          name={item.icon}
                          className={cn("h-4 w-4 text-slate-500", active && "text-accent-soft")}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="top-navigation-utilities flex shrink-0 items-center justify-end gap-2 justify-self-end 2xl:gap-2.5">
            <WorkspaceSwitcher
              activeWorkspaceId={activeWorkspaceId}
              label={`+ ${copy.addBusiness}`}
              onWorkspaceModeChange={setWorkspaceMode}
              workspaces={workspaces}
            />

            <label className="group relative hidden w-[160px] min-[1500px]:block 2xl:w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/45" />
              <Input
                className="h-10 rounded-full border-cyan-400/20 bg-slate-950/75 pl-9 pr-3 text-xs text-slate-100 shadow-[0_12px_34px_rgba(0,0,0,0.16)] placeholder:text-slate-500/75 hover:border-cyan-300/30 hover:bg-slate-950/80 focus:border-cyan-300/50 focus:bg-slate-950/85 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.10),0_16px_42px_rgba(0,0,0,0.22)]"
                placeholder={copy.search}
              />
            </label>

            <MonthSelector className="w-[120px] 2xl:w-[132px]" />

            <button
              type="button"
              suppressHydrationWarning
              className={cn(
                "flex h-10 w-[112px] min-w-0 items-center justify-start gap-2 rounded-full border border-slate-800/90 bg-slate-950/60 py-1 pl-1.5 pr-3 shadow-[0_12px_34px_rgba(0,0,0,0.16)] transition hover:border-accent/30 hover:bg-slate-900/65 hover:shadow-[0_16px_42px_rgba(34,211,238,0.07)] 2xl:w-[122px]",
                !isSupabaseReady && "border-warning/40 bg-warning/10"
              )}
              title={isSupabaseReady ? copy.profileWorkspace : copy.setupNeeded}
              aria-label={copy.profileWorkspace}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 text-xs font-black text-cyan-100">
                {isSupabaseReady ? profileInitial : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{profileName}</p>
                <p className="truncate text-[11px] text-muted">{profileSubtitle}</p>
              </div>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border border-slate-800/80 bg-slate-950/42 hover:border-accent/30 hover:bg-sky/10"
              onClick={handleLogout}
              aria-label={copy.logout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-14 items-center justify-between gap-3 xl:hidden">
          <Link
            href="/dashboard"
            prefetch
            onMouseEnter={() => prefetchRoute("/dashboard")}
            onFocus={() => prefetchRoute("/dashboard")}
            className="group flex min-w-0 shrink-0 items-center gap-3 rounded-2xl pr-3 transition hover:opacity-95"
            aria-label="DFT dashboard"
          >
            <DftLogo size="sm" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white">DFT</p>
              <p className="truncate text-xs text-muted">Dgm Finance Tracker</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setMobileOpen((currentOpen) => !currentOpen)}
            aria-label={mobileOpen ? copy.closeMenu : copy.openMenu}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {mobileOpen ? (
          <div className="top-navigation-mobile-panel mt-3 rounded-[1.5rem] border border-accent/20 bg-slate-950/90 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl xl:hidden">
            <div className="mb-3 rounded-2xl border border-slate-800/85 bg-slate-950/55 p-3">
              <p className="text-sm font-black text-white">{profileName}</p>
              <p className="mt-1 truncate text-xs text-muted">{profileSubtitle}</p>
            </div>

            <div className="grid gap-2">
              <WorkspaceSwitcher
                activeWorkspaceId={activeWorkspaceId}
                label={`+ ${copy.addBusiness}`}
                onWorkspaceModeChange={setWorkspaceMode}
                variant="mobile"
                workspaces={workspaces}
              />

              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/45" />
                <Input
                  className="border-cyan-400/20 bg-slate-950/70 pl-9 placeholder:text-slate-500/80 focus:border-cyan-300/50"
                  placeholder={copy.searchFinance}
                />
              </label>
              <MonthSelector />
            </div>

            <nav className="mt-3 grid gap-1" aria-label={copy.mobileNavigation}>
              {localizedTopNavigation.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.id ?? item.href}
                    href={item.href}
                    prefetch
                    onMouseEnter={() => prefetchRoute(item.href)}
                    onFocus={() => prefetchRoute(item.href)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold text-slate-300 transition hover:border-accent/25 hover:bg-sky/10 hover:text-white",
                      active &&
                        "border-accent/30 bg-sky/10 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.08)]"
                    )}
                  >
                    <AppIcon
                      name={item.icon}
                      className={cn("h-5 w-5 text-slate-500", active && "text-accent-soft")}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Button className="mt-3 w-full" variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {copy.logout}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
