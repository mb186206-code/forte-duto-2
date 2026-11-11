import type { Cents } from "@/lib/money";

export type CampaignStatus = "planejada" | "ativa" | "pausada" | "encerrada";
export type AttributionType = "declarada" | "rastreada" | "desconhecida";

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = { planejada: "Planejada", ativa: "Ativa", pausada: "Pausada", encerrada: "Encerrada" };
export const ATTRIBUTION_LABEL: Record<AttributionType, string> = {
  declarada: "Cliente disse que viu o anúncio",
  rastreada: "Veio pelo link do anúncio",
  desconhecida: "Não sei de onde veio",
};
export const ATTRIBUTION_SHORT: Record<AttributionType, string> = { declarada: "Declarada", rastreada: "Rastreada", desconhecida: "Desconhecida" };

export type CampaignStats = {
  spend: Cents;
  reach: number;
  impressions: number;
  clicks: number;
  conversations: number;
  /** Pessoas ligadas à campanha (cada pessoa conta uma vez). */
  contacts: number;
  /** Dessas, quantas já pagaram alguma coisa. */
  clients: number;
  /** Dinheiro que essas pessoas já pagaram (receitas recebidas). */
  revenue: Cents;
  costPerContact: Cents | null;
  costPerClient: Cents | null;
  /** clientes ÷ contatos, em %. */
  conversion: number | null;
  /** (receita − investimento) ÷ investimento, em %. */
  roi: number | null;
};

export type CampaignRow = {
  id: string;
  name: string;
  platform: string;
  status: CampaignStatus;
  serviceTypeId: string | null;
  serviceTypeName: string | null;
  startDate: string | null;
  endDate: string | null;
  plannedBudget: Cents | null;
  utmCampaign: string | null;
  notes: string | null;
  stats: CampaignStats;
};

export type AdRow = { id: string; campaignId: string; name: string; format: string | null; utmContent: string | null; destinationUrl: string | null; notes: string | null };

export type MetricRow = {
  id: string;
  advertisementId: string | null;
  adName: string | null;
  periodStart: string;
  periodEnd: string;
  reach: number;
  impressions: number;
  clicks: number;
  conversations: number;
  spend: Cents;
  notes: string | null;
};

export type ContactRow = { customerId: string; name: string; type: AttributionType; adName: string | null; date: string; revenue: Cents };

export type OriginSummary = {
  byType: { type: AttributionType | "nenhuma"; label: string; count: number }[];
  bySource: { name: string; paid: boolean; count: number }[];
  newCustomers: number;
};

export type AttributionRow = {
  id: string;
  type: AttributionType;
  campaignId: string | null;
  campaignName: string | null;
  advertisementId: string | null;
  adName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  clickId: string | null;
  notes: string | null;
  occurredAt: string;
};

export type AttributionLookups = {
  campaigns: { id: string; name: string; platform: string; utmCampaign: string | null }[];
  ads: { id: string; campaignId: string; name: string }[];
};
