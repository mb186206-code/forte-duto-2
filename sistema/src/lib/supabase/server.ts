import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import { getCurrentUserName } from "@/lib/access/session";
import type { Database } from "./database.types";

/**
 * Cliente do banco para Server Components e Server Actions.
 * Envia o nome de quem está usando (cabeçalho x-app-user), que o banco grava
 * no histórico de alterações.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Banco não configurado: defina SUPABASE_URL e SUPABASE_SECRET_KEY (veja .env.example).");
  }
  const name = (await getCurrentUserName()) ?? "sistema";
  return createSupabaseClient<Database>(env.url, env.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-app-user": toHeaderSafe(name) } },
  });
}

/** Cabeçalho HTTP só aceita ASCII: "João" vira "Joao" no histórico. */
function toHeaderSafe(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").trim() || "sistema";
}
