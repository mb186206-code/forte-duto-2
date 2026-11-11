import { z } from "zod";
import { parseBRL } from "@/lib/money";
import { UTM_VALUE, slugify } from "@/lib/utm";
import { dateField, optionalDate, optionalId, optionalText } from "./financeiro";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const optionalMoney = (msg: string) =>
  z.preprocess(emptyToUndef, z.string().optional()).transform((s, ctx) => {
    if (s === undefined) return null;
    const c = parseBRL(s);
    if (c === null || c < 0) {
      ctx.addIssue({ code: "custom", message: msg });
      return z.NEVER;
    }
    return c;
  });

/** Valor UTM digitado: aceita texto livre e converte (ex.: "Black Friday" → "black-friday"). */
const utmValue = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? slugify(v) : undefined),
    z.string().regex(UTM_VALUE, `${label}: use só letras e números.`).optional(),
  );

const count = (label: string) =>
  z.preprocess(
    emptyToUndef,
    z
      .string()
      .optional()
      .transform((s, ctx) => {
        if (s === undefined) return 0;
        const n = Number(s.replace(/\./g, "").replace(",", "."));
        if (!Number.isInteger(n) || n < 0 || n > 2_000_000_000) {
          ctx.addIssue({ code: "custom", message: `${label}: digite um número inteiro. Exemplo: 120` });
          return z.NEVER;
        }
        return n;
      }),
  );

export const PLATFORMS = ["instagram_ads", "facebook_ads", "google_ads", "outras"] as const;
export const CAMPAIGN_STATUS = ["planejada", "ativa", "pausada", "encerrada"] as const;
export const ATTRIBUTION_TYPES = ["declarada", "rastreada", "desconhecida"] as const;

export const campaignSchema = z
  .object({
    id: optionalId,
    name: z.string({ error: "Dê um nome para a campanha." }).trim().min(1, "Dê um nome para a campanha.").max(120, "Nome muito longo."),
    platform: z.enum(PLATFORMS, { error: "Escolha onde o anúncio roda." }),
    status: z.enum(CAMPAIGN_STATUS).default("ativa"),
    serviceTypeId: optionalId,
    startDate: optionalDate,
    endDate: optionalDate,
    plannedBudget: optionalMoney("Valor inválido. Exemplo: 500,00"),
    utmCampaign: utmValue("Código do link"),
    notes: optionalText(2000),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "O fim não pode ser antes do começo.", when: () => true });

export const adSchema = z.object({
  id: optionalId,
  campaignId: z.uuid(),
  name: z.string({ error: "Dê um nome para o anúncio." }).trim().min(1, "Dê um nome para o anúncio.").max(120, "Nome muito longo."),
  format: optionalText(40),
  utmContent: utmValue("Código do anúncio"),
  destinationUrl: optionalText(1000),
  notes: optionalText(1000),
});

export const metricSchema = z
  .object({
    campaignId: z.uuid(),
    advertisementId: optionalId,
    periodStart: dateField("Escolha o primeiro dia."),
    periodEnd: dateField("Escolha o último dia."),
    spend: optionalMoney("Valor inválido. Exemplo: 150,00"),
    reach: count("Alcance"),
    impressions: count("Impressões"),
    clicks: count("Cliques"),
    conversations: count("Conversas"),
    notes: optionalText(1000),
  })
  .refine((v) => v.periodEnd >= v.periodStart, { path: ["periodEnd"], message: "O último dia não pode ser antes do primeiro.", when: () => true });

export const attributionSchema = z
  .object({
    customerId: z.uuid(),
    type: z.enum(ATTRIBUTION_TYPES, { error: "Escolha como o cliente chegou." }),
    campaignId: optionalId,
    advertisementId: optionalId,
    utmSource: utmValue("Origem do link"),
    utmMedium: utmValue("Meio do link"),
    utmCampaign: utmValue("Campanha do link"),
    utmContent: utmValue("Anúncio do link"),
    clickId: optionalText(300),
    notes: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    if (v.type === "rastreada" && !v.utmSource && !v.utmCampaign && !v.clickId && !v.campaignId) {
      ctx.addIssue({ code: "custom", path: ["utmSource"], message: "Para “veio pelo link”, informe a campanha ou os dados do link (origem, campanha ou código de clique)." });
    }
    if (v.type === "desconhecida" && v.campaignId) {
      ctx.addIssue({ code: "custom", path: ["campaignId"], message: "Se não sabe de onde veio, deixe a campanha em branco." });
    }
  });
