import { cookies } from "next/headers";

import { InventoryManager } from "@/components/finance/inventory-manager";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  const workspaces = user && supabase ? await getUserWorkspaces(supabase, user.id) : [];
  const cookieStore = await cookies();
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    cookieStore.get(activeWorkspaceCookieName)?.value
  );

  return <InventoryManager activeWorkspace={activeWorkspace} />;
}
