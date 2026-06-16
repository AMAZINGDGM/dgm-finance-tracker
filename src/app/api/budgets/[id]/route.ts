import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { budgetUpdateSchema, formatZodError } from "@/lib/finance/validation";
import { activeWorkspaceCookieName, getUserWorkspaces, pickActiveWorkspace } from "@/lib/workspaces";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = budgetUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  if (parsed.data.category_id) {
    const { data: category, error: categoryError } = await auth.supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.category_id)
      .eq("user_id", auth.user.id)
      .eq("workspace_id", activeWorkspace?.id ?? "")
      .eq("type", "expense")
      .maybeSingle();

    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Budget category must be an expense category." }, { status: 400 });
    }
  }

  const { data, error } = await auth.supabase
    .from("budgets")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ budget: data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  const { error } = await auth.supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
