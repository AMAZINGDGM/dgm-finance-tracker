import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const activeWorkspaceCookieName = "dft_active_workspace_id";
export const activeWorkspaceStorageKey = "dft-active-workspace-id";

export type WorkspaceType = "business" | "personal";

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"] & {
  type: WorkspaceType;
};

type DftSupabaseClient = SupabaseClient<Database>;

export function getWorkspaceShortLabel(workspace: Pick<Workspace, "name" | "type">) {
  if (workspace.type === "personal") {
    return "Personal";
  }

  return workspace.name.replace(/\s*business\s*$/i, "").trim() || workspace.name;
}

export function pickActiveWorkspace(
  workspaces: Workspace[],
  requestedWorkspaceId?: string | null
) {
  if (requestedWorkspaceId) {
    const requested = workspaces.find((workspace) => workspace.id === requestedWorkspaceId);

    if (requested) {
      return requested;
    }
  }

  return workspaces.find((workspace) => workspace.type === "personal") ?? workspaces[0] ?? null;
}

export async function ensureDefaultWorkspace(
  supabase: DftSupabaseClient,
  userId: string
): Promise<Workspace | null> {
  const { data: existing, error: existingError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "personal")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return null;
  }

  const workspace =
    existing ??
    (
      await supabase
        .from("workspaces")
        .insert({
          name: "Personal Finance",
          type: "personal",
          user_id: userId
        })
        .select("*")
        .single()
    ).data;

  if (!workspace) {
    return null;
  }

  await Promise.all([
    supabase
      .from("accounts")
      .update({ workspace_id: workspace.id })
      .eq("user_id", userId)
      .is("workspace_id", null),
    supabase
      .from("categories")
      .update({ workspace_id: workspace.id })
      .eq("user_id", userId)
      .is("workspace_id", null),
    supabase
      .from("transactions")
      .update({ workspace_id: workspace.id })
      .eq("user_id", userId)
      .is("workspace_id", null),
    supabase
      .from("budgets")
      .update({ workspace_id: workspace.id })
      .eq("user_id", userId)
      .is("workspace_id", null),
    supabase
      .from("goals")
      .update({ workspace_id: workspace.id })
      .eq("user_id", userId)
      .is("workspace_id", null)
  ]);

  return workspace as Workspace;
}

export async function getUserWorkspaces(supabase: DftSupabaseClient, userId: string) {
  await ensureDefaultWorkspace(supabase, userId);

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("type", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as Workspace[];
}

export function getWorkspaceScopedQuery<TQuery>(
  query: TQuery,
  workspaceId?: string | null
) {
  if (!workspaceId) {
    return query;
  }

  return (query as { eq: (column: string, value: string) => TQuery }).eq(
    "workspace_id",
    workspaceId
  );
}
