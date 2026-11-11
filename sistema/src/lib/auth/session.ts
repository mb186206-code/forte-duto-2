import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccess, isRole, type ModuleKey, type Role } from "./permissions";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
};

/**
 * Data Access Layer: lê a sessão e o perfil UMA vez por requisição.
 */
type SessionResult =
  | { status: "ok"; user: CurrentUser }
  | { status: "anonymous" }
  | { status: "inactive" };

const readSession = cache(async (): Promise<SessionResult> => {
  const supabase = await createClient();
  // getUser() valida o token no servidor do Supabase Auth (não confia só no cookie)
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) return { status: "anonymous" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role, active")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile || !profile.active || !isRole(profile.role)) return { status: "inactive" };

  return {
    status: "ok",
    user: {
      id: auth.user.id,
      email: profile.email || auth.user.email || "",
      fullName: profile.full_name || auth.user.email || "Usuário",
      phone: profile.phone,
      role: profile.role,
    },
  };
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const result = await readSession();
  return result.status === "ok" ? result.user : null;
}

/** Exige usuário logado e ativo; senão, encerra a sessão e volta para o login. */
export async function requireUser(): Promise<CurrentUser> {
  const result = await readSession();
  if (result.status === "anonymous") redirect("/login");
  if (result.status === "inactive") redirect("/auth/sair?motivo=inativo");
  return result.user;
}

/** Exige acesso ao módulo; senão, mostra a página de acesso negado. */
export async function requireModule(module: ModuleKey): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canAccess(user.role, module)) redirect(`/sem-permissao?modulo=${module}`);
  return user;
}
