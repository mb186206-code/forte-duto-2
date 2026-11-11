import { describe, expect, it } from "vitest";
import { buildUtmLink, slugify } from "./utm";
import { adSchema, attributionSchema, campaignSchema, metricSchema } from "./validation/marketing";

const ID = "11111111-1111-4111-8111-111111111111";

describe("utm", () => {
  it("slugify tira acento e símbolos", () => {
    expect(slugify("Black Friday — Desentupimento!")).toBe("black-friday-desentupimento");
    expect(slugify("  ÁGUA & Esgoto ")).toBe("agua-esgoto");
  });
  it("monta o link e mantém parâmetros existentes", () => {
    const l = buildUtmLink("fortedutodesentupidora.com.br/orcamento?x=1", { source: "instagram", medium: "cpc", campaign: "verao", content: "video-1" })!;
    const u = new URL(l);
    expect(u.searchParams.get("x")).toBe("1");
    expect(u.searchParams.get("utm_source")).toBe("instagram");
    expect(u.searchParams.get("utm_content")).toBe("video-1");
    expect(u.protocol).toBe("https:");
  });
  it("recusa endereço inválido", () => {
    expect(buildUtmLink("", { source: "a", medium: "b", campaign: "c" })).toBeNull();
    expect(buildUtmLink("semponto", { source: "a", medium: "b", campaign: "c" })).toBeNull();
  });
});

describe("marketing: validação", () => {
  it("campanha: nome e plataforma; código do link vira slug", () => {
    expect(campaignSchema.safeParse({ name: "", platform: "google_ads" }).success).toBe(false);
    const r = campaignSchema.safeParse({ name: "Verão", platform: "google_ads", utmCampaign: "Black Friday 2026", plannedBudget: "500" });
    expect(r.success && r.data.utmCampaign).toBe("black-friday-2026");
    expect(r.success && r.data.plannedBudget).toBe(50000);
  });
  it("campanha: fim antes do começo é recusado", () => {
    expect(campaignSchema.safeParse({ name: "A", platform: "outras", startDate: "2026-11-10", endDate: "2026-11-01" }).success).toBe(false);
  });
  it("números do período: vazios viram zero; inválidos são recusados", () => {
    const r = metricSchema.safeParse({ campaignId: ID, periodStart: "2026-11-01", periodEnd: "2026-11-07", spend: "150,50", clicks: "1.200" });
    expect(r.success && r.data.spend).toBe(15050);
    expect(r.success && r.data.clicks).toBe(1200);
    expect(r.success && r.data.reach).toBe(0);
    expect(metricSchema.safeParse({ campaignId: ID, periodStart: "2026-11-01", periodEnd: "2026-11-07", clicks: "abc" }).success).toBe(false);
    expect(metricSchema.safeParse({ campaignId: ID, periodStart: "2026-11-08", periodEnd: "2026-11-07" }).success).toBe(false);
  });
  it("anúncio: exige nome", () => {
    expect(adSchema.safeParse({ campaignId: ID, name: " " }).success).toBe(false);
  });
  it("origem: rastreada exige evidência; desconhecida não pode ter campanha", () => {
    expect(attributionSchema.safeParse({ customerId: ID, type: "rastreada" }).success).toBe(false);
    expect(attributionSchema.safeParse({ customerId: ID, type: "rastreada", utmSource: "instagram" }).success).toBe(true);
    expect(attributionSchema.safeParse({ customerId: ID, type: "rastreada", campaignId: ID }).success).toBe(true);
    expect(attributionSchema.safeParse({ customerId: ID, type: "desconhecida", campaignId: ID }).success).toBe(false);
    expect(attributionSchema.safeParse({ customerId: ID, type: "declarada" }).success).toBe(true);
  });
});
