import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { getUserWorkspaces } from "@/lib/workspaces";

export async function GET(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const workspaceId = request.nextUrl.searchParams.get("workspace_id");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id is required." }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const workspace = workspaces.find((item) => item.id === workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const [accountsResult, categoriesResult] = await Promise.all([
    auth.supabase
      .from("accounts")
      .select("id,user_id,workspace_id,name,type,initial_balance,current_balance,color,icon,created_at,updated_at")
      .eq("user_id", auth.user.id)
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true }),
    auth.supabase
      .from("categories")
      .select("id,user_id,workspace_id,name,type,color,icon,created_at")
      .eq("user_id", auth.user.id)
      .eq("workspace_id", workspace.id)
      .order("type", { ascending: true })
      .order("name", { ascending: true })
  ]);

  if (accountsResult.error) {
    return NextResponse.json({ error: accountsResult.error.message }, { status: 400 });
  }

  if (categoriesResult.error) {
    return NextResponse.json({ error: categoriesResult.error.message }, { status: 400 });
  }

  return NextResponse.json({
    accounts: accountsResult.data ?? [],
    categories: categoriesResult.data ?? [],
    workspace
  });
}
