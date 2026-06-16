import { cookies } from "next/headers";

import { CapitalManager } from "@/components/finance/capital-manager";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";

export default async function CapitalPage() {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  const workspaces = user && supabase ? await getUserWorkspaces(supabase, user.id) : [];
  const cookieStore = await cookies();
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    cookieStore.get(activeWorkspaceCookieName)?.value
  );

  return <CapitalManager activeWorkspace={activeWorkspace} />;
}
