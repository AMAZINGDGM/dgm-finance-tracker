import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { capitalEntrySchema, formatZodError } from "@/lib/finance/validation";
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

  if (activeWorkspace?.type !== "business") {
    return NextResponse.json({ capitalEntries: [] });
  }

  const query = auth.supabase
    .from("capital_entries")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  const { data, error } = await getWorkspaceScopedQuery(query, activeWorkspace.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ capitalEntries: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = capitalEntrySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  if (activeWorkspace?.type !== "business") {
    return NextResponse.json(
      { error: "Capital entries are available for business workspaces only." },
      { status: 403 }
    );
  }

  let linkedAccountBalance: number | null = null;

  if (parsed.data.account_id) {
    const { data: account, error: accountError } = await auth.supabase
      .from("accounts")
      .select("id,current_balance")
      .eq("id", parsed.data.account_id)
      .eq("user_id", auth.user.id)
      .eq("workspace_id", activeWorkspace.id)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    if (!account) {
      return NextResponse.json({ error: "Select a valid business account." }, { status: 400 });
    }

    linkedAccountBalance = Number(account.current_balance ?? 0);
  }

  const { data, error } = await auth.supabase
    .from("capital_entries")
    .insert({
      ...parsed.data,
      account_id: parsed.data.account_id || null,
      notes: parsed.data.notes || null,
      payment_method: parsed.data.payment_method || null,
      reference: parsed.data.reference || null,
      source: parsed.data.source || null,
      user_id: auth.user.id,
      workspace_id: activeWorkspace.id
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (parsed.data.account_id && linkedAccountBalance !== null) {
    const direction = parsed.data.type === "owner_capital_in" ? 1 : -1;
    const nextBalance = linkedAccountBalance + parsed.data.amount * direction;
    const { error: balanceError } = await auth.supabase
      .from("accounts")
      .update({ current_balance: nextBalance })
      .eq("id", parsed.data.account_id)
      .eq("user_id", auth.user.id)
      .eq("workspace_id", activeWorkspace.id);

    if (balanceError) {
      return NextResponse.json(
        {
          error:
            "Capital entry was saved, but the linked account balance could not be updated. " +
            balanceError.message
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ capitalEntry: data }, { status: 201 });
}
