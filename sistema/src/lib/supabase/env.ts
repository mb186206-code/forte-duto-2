import "server-only";

/**
 * O sistema não tem login individual: SÓ o servidor fala com o banco, usando a
 * chave secreta. Nenhuma chave do Supabase vai para o navegador.
 */
export type SupabaseServerEnv = { url: string; secretKey: string };

export function getSupabaseEnv(): SupabaseServerEnv | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}
