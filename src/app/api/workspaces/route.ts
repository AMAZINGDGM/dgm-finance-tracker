import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireFinanceUser } from "@/lib/api/auth";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name is required."),
  type: z.enum(["business", "personal"]).default("business")
});

const businessCategories = [
  { name: "Sales Revenue", type: "income", color: "#22C55E", icon: "Store" },
  { name: "Owner Capital", type: "income", color: "#38BDF8", icon: "HandCoins" },
  { name: "Owner Capital In", type: "income", color: "#38BDF8", icon: "HandCoins" },
  { name: "Refund Received", type: "income", color: "#22D3EE", icon: "RefreshCcw" },
  { name: "Other Business Income", type: "income", color: "#6366F1", icon: "CircleDollarSign" },
  { name: "Inventory Purchase", type: "expense", color: "#F43F5E", icon: "Package" },
  { name: "Shopee Fee", type: "expense", color: "#FB7185", icon: "ReceiptText" },
  { name: "Transfer Fee", type: "expense", color: "#F59E0B", icon: "ArrowLeftRight" },
  { name: "Packaging", type: "expense", color: "#A78BFA", icon: "Package" },
  { name: "Shipping", type: "expense", color: "#60A5FA", icon: "Plane" },
  { name: "Refund/Cashback", type: "expense", color: "#F472B6", icon: "RefreshCcw" },
  { name: "Ads/Promotion", type: "expense", color: "#818CF8", icon: "Sparkles" },
  { name: "Product Loss/Damage", type: "expense", color: "#E11D48", icon: "ShieldAlert" },
  { name: "Owner Withdrawal", type: "expense", color: "#FB7185", icon: "ArrowUpRight" },
  { name: "Reimbursement", type: "expense", color: "#818CF8", icon: "RefreshCw" },
  { name: "Other Business Expense", type: "expense", color: "#94A3B8", icon: "ReceiptText" }
];

const businessAccounts = [
  { name: "Business Cash", type: "business", color: "#38BDF8", icon: "Briefcase" },
  { name: "Shopee Seller Balance", type: "business", color: "#F472B6", icon: "Store" },
  { name: "SeaBank Davenue", type: "bank", color: "#6366F1", icon: "Landmark" },
  { name: "Davenue ShopeePay", type: "e-wallet", color: "#22D3EE", icon: "Smartphone" },
  { name: "Davenue GoPay", type: "e-wallet", color: "#22C55E", icon: "Smartphone" }
];

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

  return NextResponse.json({
    activeWorkspace,
    workspaces
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = workspaceSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(" ") },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      type: parsed.data.type,
      user_id: auth.user.id
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.type === "business") {
    await Promise.all([
      auth.supabase.from("categories").insert(
        businessCategories.map((category) => ({
          ...category,
          user_id: auth.user.id,
          workspace_id: data.id
        }))
      ),
      auth.supabase.from("accounts").insert(
        businessAccounts.map((account) => ({
          ...account,
          current_balance: 0,
          initial_balance: 0,
          user_id: auth.user.id,
          workspace_id: data.id
        }))
      )
    ]);
  }

  const response = NextResponse.json({ workspace: data }, { status: 201 });
  response.cookies.set(activeWorkspaceCookieName, data.id, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax"
  });

  return response;
}
