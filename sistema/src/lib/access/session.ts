import "server-only";
import { cookies } from "next/headers";
import { NAME_COOKIE } from "./token";

/** Nome de quem está usando este celular (vai para o histórico de alterações). */
export async function getCurrentUserName(): Promise<string | null> {
  const raw = (await cookies()).get(NAME_COOKIE)?.value;
  if (!raw) return null;
  try {
    const name = decodeURIComponent(raw).trim();
    return name ? name.slice(0, 60) : null;
  } catch {
    return null;
  }
}
