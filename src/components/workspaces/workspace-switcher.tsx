"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Check, ChevronDown, Sparkles, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  activeWorkspaceCookieName,
  activeWorkspaceStorageKey,
  getWorkspaceShortLabel,
  type Workspace
} from "@/lib/workspaces";

type WorkspaceSwitcherProps = {
  activeWorkspaceId?: string | null;
  className?: string;
  compact?: boolean;
  label?: string;
  onWorkspaceModeChange?: (mode: "business" | "personal") => void;
  variant?: "badge" | "nav" | "mobile";
  workspaces: Workspace[];
};

export function WorkspaceSwitcher({
  activeWorkspaceId,
  className,
  compact = false,
  label = "+ Add Business Workspace",
  onWorkspaceModeChange,
  variant = "nav",
  workspaces
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState("Davenue Business");
  const [saving, setSaving] = useState(false);
  const [workspaceList, setWorkspaceList] = useState(workspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    activeWorkspaceId ?? workspaces[0]?.id ?? null
  );
  const activeWorkspace = useMemo(
    () =>
      workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) ??
      workspaceList.find((workspace) => workspace.type === "personal") ??
      workspaceList[0] ??
      null,
    [selectedWorkspaceId, workspaceList]
  );
  const workspaceMode = activeWorkspace?.type === "business" ? "business" : "personal";

  useEffect(() => {
    setWorkspaceList(workspaces);
    setSelectedWorkspaceId(activeWorkspaceId ?? workspaces[0]?.id ?? null);
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    onWorkspaceModeChange?.(workspaceMode);
  }, [onWorkspaceModeChange, workspaceMode]);

  function activateWorkspace(workspace: Workspace) {
    if (workspace.id === selectedWorkspaceId) {
      setOpen(false);
      return;
    }

    setSelectedWorkspaceId(workspace.id);
    setOpen(false);
    window.localStorage.setItem(activeWorkspaceStorageKey, workspace.id);
    document.cookie = `${activeWorkspaceCookieName}=${workspace.id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    onWorkspaceModeChange?.(workspace.type === "business" ? "business" : "personal");
    router.prefetch(pathname);
    startTransition(() => {
      router.refresh();
    });
  }

  async function createBusinessWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = businessName.trim();
    if (!name) {
      toast.error("Business name is required.");
      return;
    }

    setSaving(true);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12_000);
      const response = await fetch("/api/workspaces", {
        body: JSON.stringify({ name, type: "business" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal
      }).finally(() => window.clearTimeout(timeout));
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; workspace?: Workspace }
        | null;

      if (!response.ok || !payload?.workspace) {
        throw new Error(payload?.error ?? "Could not create business workspace.");
      }

      setWorkspaceList((current) => [...current, payload.workspace as Workspace]);
      setModalOpen(false);
      activateWorkspace(payload.workspace);
      toast.success("Business workspace created.");
    } catch (error) {
      console.error("[workspace-switcher:create-business]", error);
      toast.error(error instanceof Error ? error.message : "Could not create business workspace.");
    } finally {
      setSaving(false);
    }
  }

  if (!activeWorkspace) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        suppressHydrationWarning
        className={cn(
          "group flex items-center text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300/45",
          variant === "badge" &&
            "min-h-8 max-w-full gap-2 rounded-full border border-cyan-300/25 bg-slate-950/42 px-3 py-1 text-xs font-bold text-cyan-100 shadow-[0_12px_34px_rgba(0,0,0,0.14)] hover:border-cyan-300/45 hover:bg-cyan-300/10",
          variant === "nav" &&
            "h-10 w-[140px] max-w-[150px] gap-1.5 rounded-full border border-cyan-300/18 bg-slate-950/64 px-2 shadow-[0_12px_34px_rgba(0,0,0,0.16)] hover:border-cyan-300/35 hover:bg-slate-900/70",
          variant === "mobile" &&
            "w-full gap-3 rounded-2xl border border-cyan-300/18 bg-slate-950/55 px-3 py-2.5 hover:bg-sky/10"
        )}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center border border-cyan-300/18 bg-cyan-300/10 text-cyan-100",
            variant === "badge" ? "h-5 w-5 rounded-full" : "h-6 w-6 rounded-full"
          )}
        >
          {workspaceMode === "business" ? (
            <Briefcase className={variant === "badge" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} aria-hidden="true" />
          ) : (
            <UserRound className={variant === "badge" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[13px] font-bold leading-4 text-white", variant === "badge" && "text-xs text-cyan-100")}>
            {variant === "badge" ? activeWorkspace.name : getWorkspaceShortLabel(activeWorkspace)}
          </span>
          {variant !== "badge" && variant !== "nav" && !compact ? (
            <span className="block truncate text-[9px] font-semibold uppercase leading-3 tracking-[0.08em] text-muted">
              {isPending ? "Switching..." : `${activeWorkspace.type} Workspace`}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-slate-500 transition", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-[1.25rem] border border-accent/20 bg-slate-950/95 p-2 shadow-[0_24px_90px_rgba(0,0,0,0.50),0_0_38px_rgba(34,211,238,0.08)] backdrop-blur-2xl",
            variant === "badge" ? "left-0 top-full" : "right-0 top-full"
          )}
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              Workspace Switcher
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Choose which finance workspace this app should show.
            </p>
          </div>

          <div className="grid gap-1">
            {workspaceList.map((workspace) => {
              const active = workspace.id === selectedWorkspaceId;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  suppressHydrationWarning
                  className={cn(
                    "flex min-h-12 w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-semibold text-slate-300 transition hover:bg-sky/10 hover:text-white",
                    active && "border border-accent/20 bg-sky/10 text-cyan-100"
                  )}
                  onClick={() => activateWorkspace(workspace)}
                  role="menuitem"
                >
                  <AppIcon
                    name={workspace.type === "business" ? "Briefcase" : "WalletCards"}
                    className="h-3.5 w-3.5 text-accent-soft"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{workspace.name}</span>
                    <span className="block text-xs font-medium capitalize text-muted">
                      {workspace.type}
                    </span>
                  </span>
                  {active ? <Check className="h-4 w-4 text-cyan-100" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            suppressHydrationWarning
            className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-dashed border-accent/24 px-3 py-2.5 text-left text-sm font-semibold text-cyan-100 transition hover:bg-sky/10"
            onClick={() => {
              setOpen(false);
              setModalOpen(true);
            }}
            role="menuitem"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!saving) {
              setModalOpen(false);
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-[#050816]/95 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.62),0_0_70px_rgba(34,211,238,0.12)]">
          <div
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
                  Business Workspace
                </p>
                <h2 className="mt-2 text-xl font-black text-white">Add Business Workspace</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Create a separate space for sales, expenses, inventory, capital, and reports.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                aria-label="Close business workspace form"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <form className="space-y-4" onSubmit={createBusinessWorkspace}>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Business name
                </span>
                <Input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Davenue Business"
                  autoFocus
                  required
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create workspace"}
                </Button>
              </div>
            </form>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
