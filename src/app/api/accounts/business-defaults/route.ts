import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";
import type { Database } from "@/types/database";

type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];

const businessAccountDefaults = [
  {
    name: "Business Cash",
    type: "cash",
    color: "#38BDF8",
    icon: "Wallet",
    required: true
  },
  {
    name: "Shopee Seller Balance",
    type: "business",
    color: "#F472B6",
    icon: "Store",
    required: true
  },
  {
    name: "SeaBank Davenue",
    type: "bank",
    color: "#6366F1",
    icon: "Landmark",
    required: true,
    renameFrom: "Business Bank"
  },
  {
    name: "Davenue ShopeePay",
    type: "e-wallet",
    color: "#22D3EE",
    icon: "Smartphone",
    required: true,
    renameFrom: "Business E-wallet"
  },
  {
    name: "Davenue GoPay",
    type: "e-wallet",
    color: "#22C55E",
    icon: "Smartphone",
    required: false
  }
] satisfies Array<{
  color: string;
  icon: string;
  name: string;
  renameFrom?: string;
  required: boolean;
  type: string;
}>;

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => ({}));
  const includeGopay = Boolean(body?.include_gopay);

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  if (!activeWorkspace || activeWorkspace.type !== "business") {
    return NextResponse.json(
      { error: "Recommended business accounts can only be applied inside a business workspace." },
      { status: 403 }
    );
  }

  const { data: accounts, error: accountsError } = await auth.supabase
    .from("accounts")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("workspace_id", activeWorkspace.id);

  if (accountsError) {
    return NextResponse.json({ error: accountsError.message }, { status: 400 });
  }

  const currentAccounts = [...(accounts ?? [])];
  const summary = {
    created: [] as string[],
    renamed: [] as string[],
    skipped: [] as string[]
  };

  for (const accountDefault of businessAccountDefaults) {
    if (!accountDefault.required && !includeGopay) {
      continue;
    }

    const canonical = currentAccounts.find(
      (account) => normalizeName(account.name) === normalizeName(accountDefault.name)
    );

    if (canonical) {
      summary.skipped.push(accountDefault.name);
      continue;
    }

    const generic =
      accountDefault.renameFrom &&
      currentAccounts.find(
        (account) => normalizeName(account.name) === normalizeName(accountDefault.renameFrom ?? "")
      );

    if (generic) {
      const updates: AccountUpdate = {
        name: accountDefault.name,
        type: accountDefault.type,
        color: accountDefault.color,
        icon: accountDefault.icon
      };
      const { data: renamedAccount, error: renameError } = await auth.supabase
        .from("accounts")
        .update(updates)
        .eq("id", generic.id)
        .eq("user_id", auth.user.id)
        .eq("workspace_id", activeWorkspace.id)
        .select("*")
        .single();

      if (renameError) {
        return NextResponse.json({ error: renameError.message }, { status: 400 });
      }

      const index = currentAccounts.findIndex((account) => account.id === generic.id);
      if (index >= 0) {
        currentAccounts[index] = renamedAccount;
      }
      summary.renamed.push(`${accountDefault.renameFrom} -> ${accountDefault.name}`);
      continue;
    }

    const insertPayload: AccountInsert = {
      user_id: auth.user.id,
      workspace_id: activeWorkspace.id,
      name: accountDefault.name,
      type: accountDefault.type,
      initial_balance: 0,
      current_balance: 0,
      color: accountDefault.color,
      icon: accountDefault.icon
    };
    const { data: createdAccount, error: createError } = await auth.supabase
      .from("accounts")
      .insert(insertPayload)
      .select("*")
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    currentAccounts.push(createdAccount);
    summary.created.push(accountDefault.name);
  }

  return NextResponse.json({
    accounts: currentAccounts.sort((a, b) => a.created_at.localeCompare(b.created_at)),
    summary
  });
}
