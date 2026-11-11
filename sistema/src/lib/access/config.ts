/**
 * Usuários do sistema (poucas pessoas de confiança), definidos na variável
 * APP_USERS no formato `nome:senha,nome:senha`. Ex.: `pedro:1234,daniel:1234`.
 * Sem APP_USERS o sistema abre direto (só pede o nome de quem está usando).
 */
export type AppUser = { name: string; password: string };
export type AccessConfig = { users: AppUser[]; secret: string } | null;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function parseUsers(raw: string | undefined): AppUser[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const i = entry.indexOf(":");
      if (i < 1) return [];
      const name = entry.slice(0, i).trim();
      const password = entry.slice(i + 1).trim();
      return name && password ? [{ name: capitalize(name), password }] : [];
    });
}

export function findUser(users: AppUser[], typedName: string): AppUser | undefined {
  const wanted = normalizeName(typedName);
  return users.find((u) => normalizeName(u.name) === wanted);
}

/** Texto que o passe assinado protege: trocar nome ou senha desconecta a pessoa. */
export const userKey = (u: AppUser) => `${normalizeName(u.name)}|${u.password}`;

export function getAccessConfig(): AccessConfig {
  const users = parseUsers(process.env.APP_USERS);
  if (users.length === 0) return null;
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("APP_SESSION_SECRET precisa ter pelo menos 32 caracteres quando APP_USERS está definido.");
  }
  return { users, secret };
}
