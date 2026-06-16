import { NextResponse, type NextRequest } from "next/server";

import { isAiConfigured } from "@/lib/config/server";
import { parseFinanceMessage } from "@/lib/ai/rule-parser";
import { parseWithOpenAI } from "@/lib/ai/openai-parser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  getWorkspaceScopedQuery,
  pickActiveWorkspace
} from "@/lib/workspaces";
import type { Account, Category } from "@/types/entities";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let accounts: Account[] = [];
  let categories: Category[] = [];

  if (supabase && user) {
    const workspaces = await getUserWorkspaces(supabase, user.id);
    const activeWorkspace = pickActiveWorkspace(
      workspaces,
      request.cookies.get(activeWorkspaceCookieName)?.value
    );
    const [accountsResult, categoriesResult] = await Promise.all([
      getWorkspaceScopedQuery(
        supabase.from("accounts").select("*").eq("user_id", user.id),
        activeWorkspace?.id
      ),
      getWorkspaceScopedQuery(
        supabase.from("categories").select("*").eq("user_id", user.id),
        activeWorkspace?.id
      )
    ]);

    accounts = (accountsResult.data ?? []) as Account[];
    categories = (categoriesResult.data ?? []) as Category[];
    const workspaceType: "business" | "personal" =
      activeWorkspace?.type === "business" ? "business" : "personal";

    const context = {
      accounts: accounts.map((account) => ({ id: account.id, name: account.name })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type as "income" | "expense"
      })),
      now: new Date(),
      workspaceType
    };
    const aiParsed = isAiConfigured() ? await parseWithOpenAI(message, context).catch(() => null) : null;
    const parsed = aiParsed ?? parseFinanceMessage(message, context);

    await supabase.from("ai_logs").insert({
      user_id: user.id,
      message,
      parsed_result: parsed,
      action: "parse_preview"
    });

    return NextResponse.json({
      mode: parsed.parser ?? "rule-based-fallback",
      needsConfirmation: true,
      parsed
    });
  }

  const context = {
    accounts: accounts.map((account) => ({ id: account.id, name: account.name })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type as "income" | "expense"
    })),
    now: new Date(),
    workspaceType: "personal" as const
  };
  const aiParsed = isAiConfigured() ? await parseWithOpenAI(message, context).catch(() => null) : null;
  const parsed = aiParsed ?? parseFinanceMessage(message, context);

  return NextResponse.json({
    mode: parsed.parser ?? "rule-based-fallback",
    needsConfirmation: true,
    parsed
  });
}
