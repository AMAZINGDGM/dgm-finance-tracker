import { NextResponse } from "next/server";

import { defaultAccounts, defaultCategories } from "@/lib/finance/defaults";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/workspaces";

async function getSetupStatus(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const workspace = await ensureDefaultWorkspace(supabase, userId);
  const [{ count: accounts }, { count: categories }, { data: profile }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("workspace_id", workspace?.id ?? ""),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("workspace_id", workspace?.id ?? ""),
    supabase.from("profiles").select("id").eq("id", userId).maybeSingle()
  ]);

  return {
    accounts: accounts ?? 0,
    categories: categories ?? 0,
    profileReady: Boolean(profile)
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { accounts: 0, categories: 0, profileReady: false },
      { status: 200 }
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getSetupStatus(user.id);
  return NextResponse.json(status);
}

export async function POST() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? "DFT User";

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      preferred_language: "en",
      currency: "IDR"
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const status = await getSetupStatus(user.id);
  const workspace = await ensureDefaultWorkspace(supabase, user.id);

  if ((status?.accounts ?? 0) === 0) {
    const { error } = await supabase.from("accounts").insert(
      defaultAccounts.map((account) => ({
        ...account,
        user_id: user.id,
        workspace_id: workspace?.id ?? null
      }))
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if ((status?.categories ?? 0) === 0) {
    const { error } = await supabase.from("categories").insert(
      defaultCategories.map((category) => ({
        ...category,
        user_id: user.id,
        workspace_id: workspace?.id ?? null
      }))
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const updatedStatus = await getSetupStatus(user.id);
  return NextResponse.json(updatedStatus);
}
