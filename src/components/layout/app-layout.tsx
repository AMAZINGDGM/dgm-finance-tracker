import { FloatingAIAssistant } from "@/components/dashboard/floating-ai-assistant";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/config/public";
import type { Workspace } from "@/lib/workspaces";

type AppLayoutProps = {
  activeWorkspaceId?: string | null;
  children: React.ReactNode;
  userName: string;
  workspaces?: Workspace[];
};

export function AppLayout({
  activeWorkspaceId,
  children,
  userName,
  workspaces = []
}: AppLayoutProps) {
  const isSupabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-premium-radial">
      <div className="aurora-grid fixed inset-0 opacity-40" aria-hidden="true" />
      <div className="relative min-h-screen min-w-0 max-w-full overflow-x-hidden">
        <TopNavigation
          activeWorkspaceId={activeWorkspaceId}
          userName={userName}
          isSupabaseReady={isSupabaseReady}
          workspaces={workspaces}
        />
        <main className="mx-auto w-full min-w-0 max-w-[1520px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
          {!isSupabaseReady ? (
            <div className="mb-5 rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm text-amber-100">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warning">Setup needed</Badge>
                <span>
                  Add Supabase values to <strong>.env.local</strong> to enable login,
                  protected data, and default user setup.
                </span>
              </div>
            </div>
          ) : null}
          {children}
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}
