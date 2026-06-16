import { NextResponse } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { getUserWorkspaces } from "@/lib/workspaces";

export async function GET() {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const [workspaces, accountsResult, categoriesResult] = await Promise.all([
      getUserWorkspaces(auth.supabase, auth.user.id),
      auth.supabase
        .from("accounts")
        .select("id,user_id,workspace_id,name,type,initial_balance,current_balance,color,icon,created_at,updated_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: true }),
      auth.supabase
        .from("categories")
        .select("id,user_id,workspace_id,name,type,color,icon,created_at")
        .eq("user_id", auth.user.id)
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
      workspaces
    });
  } catch (error) {
    console.error("[transaction-migration-options]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load migration options. Try again."
      },
      { status: 500 }
    );
  }
}
