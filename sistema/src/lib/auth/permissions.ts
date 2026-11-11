/**
 * Funções (perfis de acesso) e o que cada uma pode abrir.
 * Este mapa controla a INTERFACE (menu, botões e páginas). A proteção real
 * dos dados é feita pelo banco (RLS) — ver supabase/migrations e DATABASE.md.
 */
export const ROLES = ["admin", "financeiro", "operacional"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  financeiro: "Financeiro",
  operacional: "Operacional",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Acesso completo, inclusive usuários, exclusões e histórico de alterações.",
  financeiro: "Controle financeiro, fundos, campanhas e relatórios.",
  operacional: "Clientes, serviços e orçamentos.",
};

export type ModuleKey =
  | "dashboard"
  | "financeiro"
  | "clientes"
  | "servicos"
  | "orcamentos"
  | "marketing"
  | "fundos"
  | "relatorios"
  | "configuracoes";

const ACCESS: Record<ModuleKey, readonly Role[]> = {
  dashboard: ROLES,
  financeiro: ["admin", "financeiro"],
  clientes: ROLES,
  servicos: ROLES,
  orcamentos: ROLES,
  marketing: ["admin", "financeiro"],
  fundos: ["admin", "financeiro"],
  relatorios: ["admin", "financeiro"],
  configuracoes: ROLES,
};

export function canAccess(role: Role, module: ModuleKey): boolean {
  return ACCESS[module].includes(role);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
