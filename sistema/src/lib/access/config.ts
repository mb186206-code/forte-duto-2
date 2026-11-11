/**
 * Código da empresa (opcional). Se APP_ACCESS_CODE estiver definido, cada
 * celular digita o código UMA vez e fica liberado. Sem ele, o sistema abre
 * direto (só pede o nome de quem está usando).
 */
export type AccessConfig = { code: string; secret: string } | null;

export function getAccessConfig(): AccessConfig {
  const code = process.env.APP_ACCESS_CODE?.trim();
  if (!code) return null;
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("APP_SESSION_SECRET precisa ter pelo menos 32 caracteres quando APP_ACCESS_CODE está definido.");
  }
  return { code, secret };
}
