import { describe, expect, it } from "vitest";
import { changedFields, describeAudit, type AuditRow } from "./audit";

const base = { id: 1, record_id: "x", changed_by: "Daniel", changed_at: "2026-11-11T12:00:00Z" };

describe("histórico", () => {
  it("criar e apagar mostram o nome", () => {
    const a: AuditRow = { ...base, table_name: "customers", action: "INSERT", old_data: null, new_data: { name: "Maria" } };
    expect(describeAudit(a)).toEqual({ verb: "criou", what: "cliente", detail: "Maria" });
    expect(describeAudit({ ...a, action: "DELETE", old_data: { name: "Maria" }, new_data: null }).verb).toBe("apagou");
  });
  it("alterar lista só o que mudou, sem campos técnicos", () => {
    const f = changedFields({ name: "A", amount: 1, updated_at: "1" }, { name: "A", amount: 2, updated_at: "2" });
    expect(f).toEqual(["valor"]);
  });
  it("alteração descreve o registro e os campos", () => {
    const a: AuditRow = { ...base, table_name: "transactions", action: "UPDATE", old_data: { description: "Luz", status: "pendente" }, new_data: { description: "Luz", status: "efetivado" } };
    expect(describeAudit(a).detail).toBe("Luz (situação)");
  });
});
