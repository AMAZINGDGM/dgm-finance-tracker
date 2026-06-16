import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { accountReconcileSchema, formatZodError } from "@/lib/finance/validation";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";
import type { Database } from "@/types/database";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = accountReconcileSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  const { data: account, error: accountError } = await auth.supabase
    .from("accounts")
    .select("*")
    .eq("id", parsed.data.account_id)
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "")
    .maybeSingle();

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 400 });
  }

  if (!account) {
    return NextResponse.json({ error: "Select a valid account in this workspace." }, { status: 404 });
  }

  const currentBalance = Number(account.current_balance ?? 0);
  const realBalance = parsed.data.real_balance;
  const difference = realBalance - currentBalance;

  if (!Number.isFinite(realBalance)) {
    return NextResponse.json({ error: "Enter a valid real balance." }, { status: 400 });
  }

  if (difference === 0) {
    return NextResponse.json({
      adjusted: false,
      difference: 0,
      message: "Account already matches the real balance."
    });
  }

  const type = difference > 0 ? "income" : "expense";
  const amount = Math.abs(difference);
  const categoryPayload: CategoryInsert = {
    user_id: auth.user.id,
    workspace_id: activeWorkspace?.id ?? null,
    name: "Balance Adjustment",
    type,
    color: type === "income" ? "#22C55E" : "#F43F5E",
    icon: "Scale"
  };

  const { data: existingCategory, error: categoryLookupError } = await auth.supabase
    .from("categories")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace?.id ?? "")
    .eq("type", type)
    .ilike("name", "Balance Adjustment")
    .maybeSingle();

  if (categoryLookupError) {
    return NextResponse.json({ error: categoryLookupError.message }, { status: 400 });
  }

  let category = existingCategory;

  if (!category) {
    const { data: insertedCategory, error: categoryError } = await auth.supabase
      .from("categories")
      .insert(categoryPayload)
      .select("*")
      .single();

    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 400 });
    }

    category = insertedCategory;
  }

  const transactionPayload: TransactionInsert = {
    user_id: auth.user.id,
    workspace_id: activeWorkspace?.id ?? null,
    type,
    amount,
    category_id: category.id,
    account_id: account.id,
    transfer_from_account_id: null,
    transfer_to_account_id: null,
    date: parsed.data.date ?? todayInputValue(),
    note:
      parsed.data.note?.trim() ||
      `Balance Adjustment: reconcile ${account.name} to ${realBalance}`,
    source: "manual"
  };

  const { data: transaction, error: transactionError } = await auth.supabase
    .from("transactions")
    .insert(transactionPayload)
    .select("*")
    .single();

  if (transactionError) {
    return NextResponse.json({ error: transactionError.message }, { status: 400 });
  }

  return NextResponse.json({
    adjusted: true,
    difference,
    transaction
  });
}
