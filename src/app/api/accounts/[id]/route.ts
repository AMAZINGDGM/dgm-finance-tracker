import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { accountUpdateSchema, formatZodError } from "@/lib/finance/validation";
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

  const parsed = accountUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  const { data, error } = await auth.supabase
    .from("accounts")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ account: data });
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

  const { count, error: countError } = await auth.supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "")
    .or(`account_id.eq.${id},transfer_from_account_id.eq.${id},transfer_to_account_id.eq.${id}`);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "This account has transactions. Delete or move those transactions first." },
      { status: 409 }
    );
  }

  const { error } = await auth.supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
