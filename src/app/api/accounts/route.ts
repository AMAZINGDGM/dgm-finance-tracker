import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { accountSchema, formatZodError } from "@/lib/finance/validation";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  getWorkspaceScopedQuery,
  pickActiveWorkspace
} from "@/lib/workspaces";

export async function GET(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  const query = auth.supabase
    .from("accounts")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });
  const { data, error } = await getWorkspaceScopedQuery(query, activeWorkspace?.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ accounts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = accountSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );
  const account = {
    ...parsed.data,
    workspace_id: activeWorkspace?.id ?? null,
    user_id: auth.user.id,
    current_balance: parsed.data.current_balance ?? parsed.data.initial_balance
  };

  const { data, error } = await auth.supabase
    .from("accounts")
    .insert(account)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ account: data }, { status: 201 });
}
