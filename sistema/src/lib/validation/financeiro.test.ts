import { describe, expect, it } from "vitest";
import { accountSchema, fundMovementSchema, transactionSchema, transferSchema } from "./financeiro";

const ID = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

describe("lançamentos", () => {
  const base = { kind: "receita", description: "Desentupimento", amount: "1.234,56", date: "2026-11-11" };
  it("converte o valor em centavos", () => {
    const r = transactionSchema.safeParse({ ...base, accountId: ID, done: "on" });
    expect(r.success && r.data.amount).toBe(123456);
  });
  it("já recebido exige a conta", () => {
    const r = transactionSchema.safeParse({ ...base, done: "on" });
    expect(r.success).toBe(false);
  });
  it("pendente não exige a conta", () => {
    expect(transactionSchema.safeParse({ ...base }).success).toBe(true);
  });
  it("recusa valor zero, negativo ou texto", () => {
    for (const amount of ["0", "0,00", "-5", "abc", ""]) {
      expect(transactionSchema.safeParse({ ...base, amount }).success).toBe(false);
    }
  });
  it("recusa data inválida e descrição vazia", () => {
    expect(transactionSchema.safeParse({ ...base, date: "31/12/2026" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, description: "  " }).success).toBe(false);
  });
});

describe("contas, transferências e fundos", () => {
  it("conta: saldo inicial opcional", () => {
    const r = accountSchema.safeParse({ name: "Nubank", type: "banco", openingBalance: "" });
    expect(r.success && r.data.openingBalance).toBe(0);
    const r2 = accountSchema.safeParse({ name: "Caixa", type: "caixa", openingBalance: "250,50" });
    expect(r2.success && r2.data.openingBalance).toBe(25050);
  });
  it("transferência exige contas diferentes", () => {
    expect(transferSchema.safeParse({ fromId: ID, toId: ID, amount: "10", date: "2026-11-11" }).success).toBe(false);
    expect(transferSchema.safeParse({ fromId: ID, toId: ID2, amount: "10", date: "2026-11-11" }).success).toBe(true);
  });
  it("movimento de fundo", () => {
    const r = fundMovementSchema.safeParse({ fundId: ID, kind: "deposito", amount: "500", date: "2026-11-11" });
    expect(r.success && r.data.amount).toBe(50000);
    expect(fundMovementSchema.safeParse({ fundId: ID, kind: "x", amount: "500", date: "2026-11-11" }).success).toBe(false);
  });
});

describe("erros juntos", () => {
  it("mostra o erro do valor e o da conta ao mesmo tempo", () => {
    const r = transactionSchema.safeParse({ kind: "receita", description: "x", amount: "abc", done: "on", date: "2026-11-11" });
    expect(r.success).toBe(false);
    const paths = !r.success ? r.error.issues.map((i) => i.path[0]) : [];
    expect(paths).toContain("amount");
    expect(paths).toContain("accountId");
  });
});
