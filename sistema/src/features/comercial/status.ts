import type { BudgetRow, BudgetStatus, CustomerStatus, ServiceStatus } from "./types";

export const customerBadge = (s: CustomerStatus) => (s === "cliente" ? "success" : s === "em_atendimento" ? "info" : s === "inativo" ? "outline" : "warning") as "success" | "info" | "outline" | "warning";

export const serviceBadge = (s: ServiceStatus) =>
  (s === "concluido" ? "success" : s === "cancelado" ? "outline" : s === "em_andamento" ? "highlight" : s === "aguardando_material" ? "warning" : "info") as "success" | "outline" | "highlight" | "warning" | "info";

export const budgetBadge = (s: BudgetStatus) => (s === "aprovado" ? "success" : s === "aguardando" ? "warning" : s === "expirado" ? "danger" : "outline") as "success" | "warning" | "danger" | "outline";

/** Orçamento que passou da validade sem resposta aparece como vencido. */
export const effectiveBudgetStatus = (b: BudgetRow, today: string): BudgetStatus => (b.status === "aguardando" && b.validUntil && b.validUntil < today ? "expirado" : b.status);
