"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SetupStatus = {
  accounts: number;
  categories: number;
  profileReady: boolean;
};

export function DefaultSetupCard() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/setup-defaults", { method: "GET" });
      const result = (await response.json()) as SetupStatus;
      setStatus(result);
    } catch {
      toast.error("Could not load setup status.");
    } finally {
      setLoading(false);
    }
  }

  async function createDefaults() {
    setCreating(true);
    try {
      const response = await fetch("/api/setup-defaults", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Setup failed.");
      }

      setStatus(result);
      toast.success("Default DFT workspace is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Setup failed.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const ready = status?.profileReady && status.accounts > 0 && status.categories > 0;

  return (
    <Card className="max-w-2xl">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-accent/20 bg-sky/10 p-3 text-accent-soft">
          <Database className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-white">Prepare your default workspace</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This creates your profile, default accounts, and income/expense categories.
            The SQL trigger also handles this automatically for new Supabase users; this
            button is a safe manual repair option.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Profile", status?.profileReady ? "Ready" : "Pending"],
              ["Accounts", loading ? "..." : String(status?.accounts ?? 0)],
              ["Categories", loading ? "..." : String(status?.categories ?? 0)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={createDefaults} disabled={creating || loading}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : ready ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Database className="h-4 w-4" aria-hidden="true" />
              )}
              {ready ? "Refresh defaults" : "Create default data"}
            </Button>
            <Button variant="secondary" onClick={loadStatus} disabled={loading || creating}>
              Check status
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
