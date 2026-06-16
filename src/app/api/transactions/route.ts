import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { formatZodError, transactionSchema } from "@/lib/finance/validation";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  getWorkspaceScopedQuery,
  pickActiveWorkspace
} from "@/lib/workspaces";
import type { Database } from "@/types/database";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

async function validateTransactionReferences(
  auth: Awaited<ReturnType<typeof requireFinanceUser>> & { response?: never },
  transaction: ReturnType<typeof transactionSchema.parse>,
  workspaceId?: string | null
) {
  const accountIds = [
    transaction.account_id,
    transaction.transfer_from_account_id,
    transaction.transfer_to_account_id
  ].filter(Boolean) as string[];

  if (accountIds.length > 0) {
    const baseAccountsQuery = auth.supabase
      .from("accounts")
      .select("id")
      .eq("user_id", auth.user.id)
      .in("id", accountIds);
    const accountsQuery = workspaceId
      ? baseAccountsQuery.eq("workspace_id", workspaceId)
      : baseAccountsQuery;
    const { data: accounts, error } = await accountsQuery;

    if (error) {
      return error.message;
    }

    if ((accounts ?? []).length !== new Set(accountIds).size) {
      return "One or more selected accounts could not be found.";
    }
  }

  if (transaction.category_id) {
    const expectedType = transaction.type === "income" ? "income" : "expense";
    const baseCategoryQuery = auth.supabase
      .from("categories")
      .select("id")
      .eq("id", transaction.category_id)
      .eq("user_id", auth.user.id)
      .eq("type", expectedType);
    const categoryQuery = workspaceId
      ? baseCategoryQuery.eq("workspace_id", workspaceId)
      : baseCategoryQuery;
    const { data: category, error } = await categoryQuery.maybeSingle();

    if (error) {
      return error.message;
    }

    if (!category) {
      return "Selected category does not match this transaction type.";
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const categoryId = searchParams.get("category_id");
  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  let query = auth.supabase
    .from("transactions")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  query = getWorkspaceScopedQuery(query, activeWorkspace?.id);

  if (type && ["income", "expense", "transfer"].includes(type)) {
    query = query.eq("type", type);
  }

  if (dateFrom) {
    query = query.gte("date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("date", dateTo);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = transactionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );
  const referenceError = await validateTransactionReferences(auth, parsed.data, activeWorkspace?.id);

  if (referenceError) {
    return NextResponse.json({ error: referenceError }, { status: 400 });
  }

  const payload: TransactionInsert =
    parsed.data.type === "transfer"
      ? {
          user_id: auth.user.id,
          workspace_id: activeWorkspace?.id ?? null,
          type: "transfer",
          amount: parsed.data.amount,
          category_id: null,
          account_id: null,
          transfer_from_account_id: parsed.data.transfer_from_account_id,
          transfer_to_account_id: parsed.data.transfer_to_account_id,
          date: parsed.data.date,
          note: parsed.data.note ?? null,
          source: parsed.data.source
        }
      : {
          user_id: auth.user.id,
          workspace_id: activeWorkspace?.id ?? null,
          type: parsed.data.type,
          amount: parsed.data.amount,
          category_id: parsed.data.category_id ?? null,
          account_id: parsed.data.account_id,
          transfer_from_account_id: null,
          transfer_to_account_id: null,
          date: parsed.data.date,
          note: parsed.data.note ?? null,
          source: parsed.data.source
        };

  const { data, error } = await auth.supabase
    .from("transactions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ transaction: data }, { status: 201 });
}
