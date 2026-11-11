/**
 * Variáveis públicas do Supabase. A chave "publishable" (ou a antiga "anon")
 * é feita para ficar no navegador: quem protege os dados é o RLS do banco.
 * A chave secreta (SUPABASE_SECRET_KEY) NUNCA é lida aqui.
 */
export type SupabasePublicEnv = { url: string; key: string };

export function getSupabaseEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function requireSupabaseEnv(): SupabasePublicEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veja .env.example).",
    );
  }
  return env;
}
