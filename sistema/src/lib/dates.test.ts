import { describe, expect, it } from "vitest";
import { addDays, dayTitle, formatDateBR, isISODate, isMonth, monthLabel, monthRange, shiftMonth, todayISO } from "./dates";

describe("datas", () => {
  it("usa o fuso de São Paulo para 'hoje'", () => {
    // 02:00 UTC de 12/11 ainda é 11/11 à noite em São Paulo
    expect(todayISO(new Date("2026-11-12T02:00:00Z"))).toBe("2026-11-11");
  });
  it("valida datas e meses", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-02-28")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-11")).toBe(true);
  });
  it("calcula o intervalo e navega entre meses", () => {
    expect(monthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthLabel("2026-11")).toBe("Novembro de 2026");
  });
  it("formata para o Brasil", () => {
    expect(formatDateBR("2026-11-05")).toBe("05/11/2026");
    expect(dayTitle("2026-11-11", "2026-11-11")).toBe("Hoje");
    expect(dayTitle("2026-11-10", "2026-11-11")).toBe("Ontem");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});
