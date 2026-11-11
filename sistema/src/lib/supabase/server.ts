import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Crie um novo a cada requisição (nunca guarde em variável global).
 */
export async function createClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: não dá para gravar cookie aqui.
          // Tudo bem, o proxy.ts renova a sessão em toda requisição.
        }
      },
    },
  });
}
