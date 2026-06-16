import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { budgetSchema, formatZodError } from "@/lib/finance/validation";
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

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );

  let query = auth.supabase
    .from("budgets")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  query = getWorkspaceScopedQuery(query, activeWorkspace?.id);

  if (month) {
    query = query.eq("month", Number(month));
  }

  if (year) {
    query = query.eq("year", Number(year));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ budgets: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();

  if ("response" in auth) {
    return auth.response;
  }

  const parsed = budgetSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    request.cookies.get(activeWorkspaceCookieName)?.value
  );
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

  const { data, error } = await auth.supabase
    .from("budgets")
    .insert({ ...parsed.data, user_id: auth.user.id, workspace_id: activeWorkspace?.id ?? null })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ budget: data }, { status: 201 });
}
