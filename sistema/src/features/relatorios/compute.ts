import { sumCents, type Cents } from "@/lib/money";

export type ExpenseClass = "custo_direto" | "despesa_operacional" | "investimento" | "imposto";

export type ReportTx = {
  kind: "receita" | "despesa" | "transferencia";
  status: "pendente" | "efetivado" | "cancelado";
  amount: Cents;
  competenceDate: string;
  settledDate: string | null;
  categoryName: string | null;
  expenseClass: ExpenseClass | null;
};

export const CLASS_LABEL: Record<ExpenseClass, string> = {
  custo_direto: "Custos do serviço (material, mão de obra)",
  despesa_operacional: "Despesas da empresa",
  imposto: "Impostos e taxas",
  investimento: "Investimentos (compra de equipamentos)",
};

export type Financials = {
  /** Tudo que foi vendido/cobrado no mês (recebido ou ainda a receber). */
  revenue: Cents;
  /** Desse faturamento, o que já entrou. */
  revenueReceived: Cents;
  revenuePending: Cents;
  byClass: Record<ExpenseClass, Cents>;
  expensesByCategory: { name: string; cls: ExpenseClass; amount: Cents }[];
  /** Faturamento − custos − despesas − impostos. Investimento não entra (é bem que fica na empresa). */
  result: Cents;
  /** Fluxo de caixa do mês: só dinheiro que realmente entrou e saiu no mês. */
  cash: { in: Cents; out: Cents; net: Cents };
};

const inRange = (d: string | null, from: string, to: string) => d !== null && d >= from && d <= to;

/**
 * Duas visões, sem misturar:
 *  - Faturamento e resultado: pela data a que o valor pertence (competência), incluindo o que ainda está pendente.
 *  - Fluxo de caixa: pela data em que o dinheiro entrou ou saiu (só efetivados).
 * Transferência e cancelado nunca entram em nada.
 */
export function computeFinancials(rows: ReportTx[], from: string, to: string): Financials {
  const live = rows.filter((r) => r.status !== "cancelado" && r.kind !== "transferencia");
  const rev = live.filter((r) => r.kind === "receita" && inRange(r.competenceDate, from, to));
  const exp = live.filter((r) => r.kind === "despesa" && inRange(r.competenceDate, from, to));

  const byClass: Record<ExpenseClass, Cents> = { custo_direto: 0, despesa_operacional: 0, imposto: 0, investimento: 0 };
  const cat = new Map<string, { name: string; cls: ExpenseClass; amount: Cents }>();
  for (const e of exp) {
    const cls = e.expenseClass ?? "despesa_operacional";
    byClass[cls] += e.amount;
    const name = e.categoryName ?? "Sem tipo";
    const key = `${cls}|${name}`;
    const cur = cat.get(key) ?? { name, cls, amount: 0 };
    cur.amount += e.amount;
    cat.set(key, cur);
  }

  const revenue = sumCents(rev.map((r) => r.amount));
  const revenueReceived = sumCents(rev.filter((r) => r.status === "efetivado").map((r) => r.amount));
  const cashIn = sumCents(live.filter((r) => r.kind === "receita" && r.status === "efetivado" && inRange(r.settledDate, from, to)).map((r) => r.amount));
  const cashOut = sumCents(live.filter((r) => r.kind === "despesa" && r.status === "efetivado" && inRange(r.settledDate, from, to)).map((r) => r.amount));

  return {
    revenue,
    revenueReceived,
    revenuePending: revenue - revenueReceived,
    byClass,
    expensesByCategory: [...cat.values()].sort((a, b) => b.amount - a.amount),
    result: revenue - byClass.custo_direto - byClass.despesa_operacional - byClass.imposto,
    cash: { in: cashIn, out: cashOut, net: cashIn - cashOut },
  };
}

export type ServiceInput = { typeName: string | null; status: string; completedDate: string | null; contractValue: Cents | null; totalCost: Cents; received: Cents };

export type ServiceReport = {
  concluded: number;
  open: number;
  cancelled: number;
  byType: { name: string; count: number; contract: Cents; cost: Cents; profit: Cents; received: Cents }[];
  totals: { contract: Cents; cost: Cents; profit: Cents; received: Cents };
};

/** Serviços concluídos no mês: quanto foi combinado, quanto custou e quanto sobra. Em aberto/cancelados são contados à parte. */
export function computeServices(rows: ServiceInput[], from: string, to: string): ServiceReport {
  const done = rows.filter((s) => s.status === "concluido" && inRange(s.completedDate, from, to));
  const map = new Map<string, ServiceReport["byType"][number]>();
  for (const s of done) {
    const name = s.typeName ?? "Sem tipo";
    const cur = map.get(name) ?? { name, count: 0, contract: 0, cost: 0, profit: 0, received: 0 };
    cur.count++;
    cur.contract += s.contractValue ?? 0;
    cur.cost += s.totalCost;
    cur.profit += (s.contractValue ?? 0) - s.totalCost;
    cur.received += s.received;
    map.set(name, cur);
  }
  const byType = [...map.values()].sort((a, b) => b.profit - a.profit);
  return {
    concluded: done.length,
    open: rows.filter((s) => s.status !== "concluido" && s.status !== "cancelado").length,
    cancelled: rows.filter((s) => s.status === "cancelado").length,
    byType,
    totals: {
      contract: sumCents(byType.map((t) => t.contract)),
      cost: sumCents(byType.map((t) => t.cost)),
      profit: sumCents(byType.map((t) => t.profit)),
      received: sumCents(byType.map((t) => t.received)),
    },
  };
}

/** Progresso de uma meta (0–100+, 1 casa). Sem meta ou meta zero → null. */
export function goalProgress(value: Cents, goal: Cents | null): number | null {
  if (goal === null || goal <= 0) return null;
  return Math.round((value * 1000) / goal) / 10;
}

/** CSV que o Excel brasileiro abre direto: separador ";", vírgula decimal e BOM. */
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    if (v === null) return "";
    const s = String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

export const centsToCsv = (c: Cents) => (c / 100).toFixed(2).replace(".", ",");
