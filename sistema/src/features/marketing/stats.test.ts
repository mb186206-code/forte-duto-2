import { describe, expect, it } from "vitest";
import { statsFor } from "./stats";

const m = (spend: number, extra = {}) => ({ campaignId: "c1", spend, reach: 0, impressions: 0, clicks: 0, conversations: 0, ...extra });

describe("números de marketing", () => {
  it("custo por contato e por cliente, conversão e ROI", () => {
    const revenue = new Map([["a", 30000], ["b", 20000]]); // a e b pagaram; c não
    const s = statsFor(
      [m(10000, { clicks: 40 }), m(5000, { clicks: 10 })],
      [{ campaignId: "c1", customerId: "a" }, { campaignId: "c1", customerId: "b" }, { campaignId: "c1", customerId: "c" }, { campaignId: "c1", customerId: "a" }],
      revenue,
    );
    expect(s.spend).toBe(15000);
    expect(s.clicks).toBe(50);
    expect(s.contacts).toBe(3); // a repetido conta uma vez
    expect(s.clients).toBe(2);
    expect(s.revenue).toBe(50000);
    expect(s.costPerContact).toBe(5000);
    expect(s.costPerClient).toBe(7500);
    expect(s.conversion).toBeCloseTo(66.67, 1);
    expect(s.roi).toBeCloseTo(233.33, 1); // (500 − 150) ÷ 150
  });
  it("sem dados não inventa números", () => {
    const s = statsFor([], [], new Map());
    expect(s.contacts).toBe(0);
    expect(s.costPerContact).toBeNull();
    expect(s.costPerClient).toBeNull();
    expect(s.conversion).toBeNull();
    expect(s.roi).toBeNull();
  });
  it("investimento sem nenhum cliente: ROI negativo de 100%, sem custo por cliente", () => {
    const s = statsFor([m(10000)], [{ campaignId: "c1", customerId: "x" }], new Map());
    expect(s.costPerContact).toBe(10000);
    expect(s.costPerClient).toBeNull();
    expect(s.roi).toBe(-100);
  });
});
