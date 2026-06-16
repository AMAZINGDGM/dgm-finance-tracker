"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, publicConfig } from "@/lib/config/public";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database, "public"> | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database, "public">(
      publicConfig.supabaseUrl!,
      publicConfig.supabaseAnonKey!
    );
  }

  return browserClient;
}
