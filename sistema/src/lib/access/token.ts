/**
 * Passe de acesso do celular (cookie assinado com HMAC-SHA256).
 * Usa Web Crypto para funcionar tanto no proxy quanto no servidor.
 */
export const ACCESS_COOKIE = "fd_acesso";
export const NAME_COOKIE = "fd_nome";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 400; // ~13 meses (limite dos navegadores)

const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * A assinatura inclui o próprio código da empresa: se o código for trocado,
 * todos os celulares precisam digitar o novo.
 */
export async function signAccess(secret: string, code: string, issuedAt = Date.now()): Promise<string> {
  const payload = String(issuedAt);
  return `${payload}.${await hmac(secret, `${payload}|${code}`)}`;
}

export async function verifyAccess(token: string | undefined, secret: string, code: string, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !/^\d+$/.test(payload)) return false;
  const issuedAt = Number(payload);
  if (issuedAt > now + 60_000 || now - issuedAt > ACCESS_MAX_AGE * 1000) return false;
  return safeEqual(sig, await hmac(secret, `${payload}|${code}`));
}

export function codesMatch(typed: string, expected: string): boolean {
  return safeEqual(typed.replace(/\s/g, ""), expected.replace(/\s/g, ""));
}
