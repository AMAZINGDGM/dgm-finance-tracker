import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/config/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getServerProfileName = cache(async function getServerProfileName(
  userId?: string | null
) {
  if (!userId || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();

  return typeof data?.full_name === "string" ? data.full_name : null;
});
