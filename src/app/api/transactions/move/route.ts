import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { formatZodError, transactionMoveSchema } from "@/lib/finance/validation";
import { getUserWorkspaces } from "@/lib/workspaces";
import type { Database } from "@/types/database";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

async function validateMoveReferences(
  auth: Awaited<ReturnType<typeof requireFinanceUser>> & { response?: never },
  value: ReturnType<typeof transactionMoveSchema.parse>
) {
  const accountIds = [
    value.account_id,
    value.transfer_from_account_id,
    value.transfer_to_account_id
  ].filter(Boolean) as string[];

  if (accountIds.length > 0) {
    const { data: accounts, error } = await auth.supabase
      .from("accounts")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("workspace_id", value.target_workspace_id)
      .in("id", accountIds);

    if (error) {
      return error.message;
    }

    if ((accounts ?? []).length !== new Set(accountIds).size) {
      return "One or more target accounts could not be found.";
    }
  }

  if (value.category_id && value.target_type !== "transfer") {
    const expectedType = value.target_type === "income" ? "income" : "expense";
    const { data: category, error } = await auth.supabase
      .from("categories")
      .select("id")
      .eq("id", value.category_id)
      .eq("user_id", auth.user.id)
      .eq("workspace_id", value.target_workspace_id)
      .eq("type", expectedType)
      .maybeSingle();

    if (error) {
      return error.message;
    }

    if (!category) {
      return "Target category does not match the selected transaction type.";
    }
  }

  return null;
}

function buildMovedTransactionPayload(
  transaction: Database["public"]["Tables"]["transactions"]["Row"],
  value: ReturnType<typeof transactionMoveSchema.parse>
): TransactionUpdate {
  const note = value.note && value.note.trim() ? value.note.trim() : transaction.note;

  if (value.target_type === "transfer") {
    return {
      workspace_id: value.target_workspace_id,
      type: "transfer",
      amount: Number(transaction.amount ?? 0),
      category_id: null,
      account_id: null,
      transfer_from_account_id: value.transfer_from_account_id,
      transfer_to_account_id: value.transfer_to_account_id,
      date: transaction.date,
      note,
      source: transaction.source
    };
  }

  return {
    workspace_id: value.target_workspace_id,
    type: value.target_type,
    amount: Number(transaction.amount ?? 0),
    category_id: value.category_id ?? null,
    account_id: value.account_id,
    transfer_from_account_id: null,
    transfer_to_account_id: null,
    date: transaction.date,
    note,
    source: transaction.source
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = transactionMoveSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const targetWorkspace = workspaces.find(
    (workspace) => workspace.id === parsed.data.target_workspace_id
  );

  if (!targetWorkspace) {
    return NextResponse.json({ error: "Target workspace not found." }, { status: 404 });
  }

  const referenceError = await validateMoveReferences(auth, parsed.data);

  if (referenceError) {
    return NextResponse.json({ error: referenceError }, { status: 400 });
  }

  const { data: transactions, error: loadError } = await auth.supabase
    .from("transactions")
    .select("*")
    .eq("user_id", auth.user.id)
    .in("id", parsed.data.transaction_ids);

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 400 });
  }

  if ((transactions ?? []).length !== new Set(parsed.data.transaction_ids).size) {
    return NextResponse.json(
      { error: "One or more selected transactions could not be found." },
      { status: 404 }
    );
  }

  const movedPayloads = (transactions ?? []).map((transaction) =>
    buildMovedTransactionPayload(transaction, parsed.data)
  );

  if (parsed.data.copy) {
    const insertPayloads: TransactionInsert[] = movedPayloads.map((payload) => ({
      user_id: auth.user.id,
      workspace_id: payload.workspace_id ?? parsed.data.target_workspace_id,
      type: payload.type ?? parsed.data.target_type,
      amount: Number(payload.amount ?? 0),
      category_id: payload.category_id ?? null,
      account_id: payload.account_id ?? null,
      transfer_from_account_id: payload.transfer_from_account_id ?? null,
      transfer_to_account_id: payload.transfer_to_account_id ?? null,
      date: payload.date ?? new Date().toISOString().slice(0, 10),
      note: payload.note ?? null,
      source: payload.source ?? "manual"
    }));
    const { error } = await auth.supabase.from("transactions").insert(insertPayloads);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ copied: insertPayloads.length, moved: 0 });
  }

  const noteUpdate =
    parsed.data.note && parsed.data.note.trim() ? { note: parsed.data.note.trim() } : {};
  const batchPayload: TransactionUpdate =
    parsed.data.target_type === "transfer"
      ? {
          ...noteUpdate,
          workspace_id: parsed.data.target_workspace_id,
          type: "transfer",
          category_id: null,
          account_id: null,
          transfer_from_account_id: parsed.data.transfer_from_account_id,
          transfer_to_account_id: parsed.data.transfer_to_account_id
        }
      : {
          ...noteUpdate,
          workspace_id: parsed.data.target_workspace_id,
          type: parsed.data.target_type,
          category_id: parsed.data.category_id ?? null,
          account_id: parsed.data.account_id,
          transfer_from_account_id: null,
          transfer_to_account_id: null
        };

  const { data: updatedTransactions, error } = await auth.supabase
    .from("transactions")
    .update(batchPayload)
    .eq("user_id", auth.user.id)
    .in("id", parsed.data.transaction_ids)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ copied: 0, moved: updatedTransactions?.length ?? 0 });
}
