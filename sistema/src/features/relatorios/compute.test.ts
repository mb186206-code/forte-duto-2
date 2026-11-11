import { describe, expect, it } from "vitest";
import { centsToCsv, computeFinancials, computeServices, goalProgress, toCsv, type ReportTx } from "./compute";

const tx = (o: Partial<ReportTx>): ReportTx => ({ kind: "receita", status: "efetivado", amount: 0, competenceDate: "2026-11-10", settledDate: "2026-11-10", categoryName: null, expenseClass: null, ...o });
const F = "2026-11-01";
const T = "2026-11-30";

describe("resultado e caixa", () => {
  const rows: ReportTx[] = [
    tx({ amount: 100000 }), // recebido
    tx({ amount: 50000, status: "pendente", settledDate: null }), // a receber (faturou, não entrou)
    tx({ kind: "despesa", amount: 20000, expenseClass: "custo_direto", categoryName: "Material" }),
    tx({ kind: "despesa", amount: 10000, expenseClass: "despesa_operacional", categoryName: "Combustível" }),
    tx({ kind: "despesa", amount: 5000, expenseClass: "imposto", categoryName: "Taxas" }),
    tx({ kind: "despesa", amount: 30000, expenseClass: "investimento", categoryName: "Máquina" }),
    tx({ kind: "despesa", amount: 7000, status: "pendente", settledDate: null, expenseClass: "custo_direto", categoryName: "Material" }),
    tx({ kind: "transferencia", amount: 99999 }),
    tx({ amount: 88888, status: "cancelado" }),
  ];
  const f = computeFinancials(rows, F, T);

  it("faturamento inclui o que ainda vai receber; transferência e cancelado ficam de fora", () => {
    expect(f.revenue).toBe(150000);
    expect(f.revenueReceived).toBe(100000);
    expect(f.revenuePending).toBe(50000);
  });
  it("resultado = faturamento − custos − despesas − impostos (investimento não entra)", () => {
    expect(f.byClass.custo_direto).toBe(27000);
    expect(f.byClass.investimento).toBe(30000);
    expect(f.result).toBe(150000 - 27000 - 10000 - 5000);
  });
  it("caixa só conta o que entrou e saiu de verdade (investimento sai do caixa)", () => {
    expect(f.cash.in).toBe(100000);
    expect(f.cash.out).toBe(20000 + 10000 + 5000 + 30000);
    expect(f.cash.net).toBe(100000 - 65000);
  });
  it("despesas por tipo somam e ordenam do maior para o menor", () => {
    expect(f.expensesByCategory[0]).toMatchObject({ name: "Máquina", amount: 30000 });
    expect(f.expensesByCategory.find((c) => c.name === "Material")?.amount).toBe(27000);
  });
  it("respeita o período: competência e caixa são independentes", () => {
    const other = [tx({ amount: 10000, competenceDate: "2026-10-30", settledDate: "2026-11-02" })]; // vendeu em outubro, recebeu em novembro
    const nov = computeFinancials(other, F, T);
    expect(nov.revenue).toBe(0);
    expect(nov.cash.in).toBe(10000);
  });
  it("sem dados: zeros", () => {
    const z = computeFinancials([], F, T);
    expect(z.result).toBe(0);
    expect(z.cash.net).toBe(0);
  });
});

describe("serviços", () => {
  it("só concluídos no mês entram no lucro; em aberto e cancelados são contados à parte", () => {
    const r = computeServices(
      [
        { typeName: "Desentupimento", status: "concluido", completedDate: "2026-11-05", contractValue: 30000, totalCost: 8000, received: 30000 },
        { typeName: "Desentupimento", status: "concluido", completedDate: "2026-11-07", contractValue: 20000, totalCost: 2000, received: 0 },
        { typeName: "Hidráulica", status: "concluido", completedDate: "2026-10-30", contractValue: 99999, totalCost: 0, received: 0 },
        { typeName: null, status: "agendado", completedDate: null, contractValue: 5000, totalCost: 0, received: 0 },
        { typeName: null, status: "cancelado", completedDate: null, contractValue: 5000, totalCost: 0, received: 0 },
      ],
      F,
      T,
    );
    expect(r.concluded).toBe(2);
    expect(r.open).toBe(1);
    expect(r.cancelled).toBe(1);
    expect(r.byType).toHaveLength(1);
    expect(r.totals).toEqual({ contract: 50000, cost: 10000, profit: 40000, received: 30000 });
  });
});

describe("meta e CSV", () => {
  it("progresso da meta", () => {
    expect(goalProgress(5000, 10000)).toBe(50);
    expect(goalProgress(15000, 10000)).toBe(150);
    expect(goalProgress(100, null)).toBeNull();
    expect(goalProgress(100, 0)).toBeNull();
  });
  it("CSV para Excel brasileiro", () => {
    const csv = toCsv(["Nome", "Valor"], [["Maria; Souza", centsToCsv(12345)], ['Ele disse "oi"', centsToCsv(5)]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"Maria; Souza";123,45');
    expect(csv).toContain('"Ele disse ""oi""";0,05');
  });
});
