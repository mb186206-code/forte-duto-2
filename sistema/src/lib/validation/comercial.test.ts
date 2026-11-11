import { describe, expect, it } from "vitest";
import { budgetItemSchema, budgetSchema, costItemSchema, customerSchema, serviceSchema, servicePaymentSchema } from "./comercial";
import { spParts, toSpInstant } from "../dates";

const ID = "11111111-1111-4111-8111-111111111111";

describe("cliente", () => {
  it("só exige o nome; vazios viram indefinidos", () => {
    const r = customerSchema.safeParse({ name: "  Maria  ", phone: "", estimatedValue: "" });
    expect(r.success && r.data.name).toBe("Maria");
    expect(r.success && r.data.phone).toBeUndefined();
    expect(r.success && r.data.estimatedValue).toBeNull();
    expect(r.success && r.data.status).toBe("novo_contato");
  });
  it("recusa nome vazio e valor inválido", () => {
    const r = customerSchema.safeParse({ name: "", estimatedValue: "abc" });
    expect(r.success).toBe(false);
    const paths = !r.success ? r.error.issues.map((i) => i.path[0]) : [];
    expect(paths).toEqual(expect.arrayContaining(["name", "estimatedValue"]));
  });
  it("valor estimado em centavos", () => {
    const r = customerSchema.safeParse({ name: "A", estimatedValue: "1.250,50" });
    expect(r.success && r.data.estimatedValue).toBe(125050);
  });
});

describe("serviço", () => {
  it("exige cliente; hora precisa ser válida", () => {
    expect(serviceSchema.safeParse({}).success).toBe(false);
    expect(serviceSchema.safeParse({ customerId: ID, scheduledTime: "25:00" }).success).toBe(false);
    const r = serviceSchema.safeParse({ customerId: ID, scheduledDate: "2026-11-20", scheduledTime: "14:30", contractValue: "300" });
    expect(r.success && r.data.contractValue).toBe(30000);
  });
  it("custo: quantidade com vírgula e valor", () => {
    const r = costItemSchema.safeParse({ serviceId: ID, kind: "material", description: "Cano", quantity: "1,5", unitCost: "10,00" });
    expect(r.success && r.data.quantity).toBe(1.5);
    expect(r.success && r.data.unitCost).toBe(1000);
    expect(costItemSchema.safeParse({ serviceId: ID, kind: "material", description: "x", quantity: "0", unitCost: "1" }).success).toBe(false);
  });
  it("pagamento já recebido exige a conta; a receber não", () => {
    expect(servicePaymentSchema.safeParse({ serviceId: ID, amount: "100", done: "on", date: "2026-11-11" }).success).toBe(false);
    expect(servicePaymentSchema.safeParse({ serviceId: ID, amount: "100", date: "2026-11-11" }).success).toBe(true);
  });
});

describe("orçamento", () => {
  it("validade não pode ser antes da emissão", () => {
    expect(budgetSchema.safeParse({ customerId: ID, issueDate: "2026-11-10", validUntil: "2026-11-01" }).success).toBe(false);
    expect(budgetSchema.safeParse({ customerId: ID, issueDate: "2026-11-10", validUntil: "2026-11-20" }).success).toBe(true);
  });
  it("item: preço em centavos", () => {
    const r = budgetItemSchema.safeParse({ budgetId: ID, kind: "mao_de_obra", description: "Mão de obra", quantity: "2", unitPrice: "75,25" });
    expect(r.success && r.data.unitPrice).toBe(7525);
  });
});

describe("horário de São Paulo", () => {
  it("ida e volta", () => {
    const iso = toSpInstant("2026-11-20", "14:30");
    expect(spParts(iso)).toEqual({ date: "2026-11-20", time: "14:30" });
    expect(spParts(toSpInstant("2026-11-20"))?.time).toBe("08:00");
  });
});
