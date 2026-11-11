import { describe, expect, it } from "vitest";
import {
  divideCents,
  formatBRL,
  formatPercent,
  fromDbAmount,
  parseBRL,
  percent,
  roiPercent,
  sumCents,
  toDbAmount,
} from "./money";

describe("parseBRL", () => {
  it.each([
    ["1234,56", 123456],
    ["1.234,56", 123456],
    ["R$ 1.234,56", 123456],
    ["R$1.234.567,8", 123456780],
    ["0,5", 50],
    [",99", 99],
    ["1234", 123400],
    ["1234.56", 123456],
    ["1234.5", 123450],
    ["1.234", 123400],
    ["1.234.567", 123456700],
    ["  10  ", 1000],
    ["-15,30", -1530],
  ])("%s → %d centavos", (input, expected) => {
    expect(parseBRL(input)).toBe(expected);
  });

  it.each(["", "abc", "1,234,56", "12,345", "1.2.3,4a", "R$", "--1"])("rejeita %j", (input) => {
    expect(parseBRL(input)).toBeNull();
  });

  it("rejeita valores acima do limite do banco", () => {
    expect(parseBRL("1.000.000.000.000,00")).toBeNull();
  });
});

describe("formatBRL", () => {
  it("formata em reais", () => {
    expect(formatBRL(123456)).toBe("R$ 1.234,56");
    expect(formatBRL(0)).toBe("R$ 0,00");
    expect(formatBRL(5)).toBe("R$ 0,05");
    expect(formatBRL(-1530)).toBe("-R$ 15,30");
  });
  it("recusa valor não inteiro", () => {
    expect(() => formatBRL(1.5)).toThrow();
  });
});

describe("conversão com o banco", () => {
  it("toDbAmount", () => {
    expect(toDbAmount(123456)).toBe("1234.56");
    expect(toDbAmount(5)).toBe("0.05");
    expect(toDbAmount(-1530)).toBe("-15.30");
  });
  it("fromDbAmount aceita string e number sem erro de float", () => {
    expect(fromDbAmount("1234.56")).toBe(123456);
    expect(fromDbAmount(0.1 + 0.2)).toBe(30);
    expect(fromDbAmount(1234.56)).toBe(123456);
    expect(fromDbAmount("10")).toBe(1000);
    expect(fromDbAmount("-0.05")).toBe(-5);
    expect(fromDbAmount(null)).toBe(0);
  });
  it("ida e volta preserva o valor", () => {
    for (const c of [0, 1, 99, 100, 123456, 9999999999999]) {
      expect(fromDbAmount(toDbAmount(c))).toBe(c);
    }
  });
});

describe("cálculos", () => {
  it("soma centavos exatamente (0,10 + 0,20 = 0,30)", () => {
    expect(sumCents([10, 20])).toBe(30);
    expect(formatBRL(sumCents([10, 20]))).toBe("R$ 0,30");
  });
  it("percentual com denominador zero é null, não 0", () => {
    expect(percent(5, 0)).toBeNull();
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2, 3)).toBe(66.7);
  });
  it("custo por cliente", () => {
    expect(divideCents(100000, 3)).toBe(33333);
    expect(divideCents(100000, 0)).toBeNull();
  });
  it("ROI de anúncios", () => {
    // investiu R$ 1.000, receita atribuída R$ 3.500 → ROI 250%
    expect(roiPercent(350000, 100000)).toBe(250);
    expect(roiPercent(50000, 100000)).toBe(-50);
    expect(roiPercent(50000, 0)).toBeNull();
  });
  it("formatPercent", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(33.3)).toBe("33,3%");
  });
});
