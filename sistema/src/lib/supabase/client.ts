"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/** Cliente Supabase para Client Components (usa a sessão dos cookies). */
export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
