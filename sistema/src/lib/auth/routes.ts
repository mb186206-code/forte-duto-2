export const LOGIN_PATH = "/login";
export const SETUP_PATH = "/configuracao-pendente";

/** Rotas acessíveis sem login. */
const PUBLIC_PATHS = new Set([LOGIN_PATH, "/recuperar-senha", "/auth/confirm", SETUP_PATH]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

/**
 * Garante que o redirecionamento depois do login fique dentro do sistema
 * (evita "open redirect" para sites externos).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (isPublicPath(next.split("?")[0])) return fallback;
  return next;
}
