import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AppLayout } from "@/components/layout/app-layout";
import { isSupabaseConfigured } from "@/lib/config/public";
import { getServerProfileName } from "@/lib/supabase/profile";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";

function getFirstName(value?: string | null) {
  const firstName = value?.trim().split(/\s+/)[0];
  return firstName && firstName.length > 0 ? firstName : "Dgm";
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (isSupabaseConfigured() && !user) {
    redirect("/login");
  }

  const profileName = await getServerProfileName(user?.id);
  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const userName = getFirstName(profileName ?? metadataName);
  const supabase = user ? await createSupabaseServerClient() : null;
  const workspaces = user && supabase ? await getUserWorkspaces(supabase, user.id) : [];
  const cookieStore = await cookies();
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    cookieStore.get(activeWorkspaceCookieName)?.value
  );

  return (
    <AppLayout
      activeWorkspaceId={activeWorkspace?.id}
      userName={userName}
      workspaces={workspaces}
    >
      {children}
    </AppLayout>
  );
}
