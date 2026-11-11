import { divideCents, percent, roiPercent, sumCents } from "@/lib/money";
import type { CampaignStats } from "./types";

export type MetricInput = { campaignId: string; spend: number; reach: number; impressions: number; clicks: number; conversations: number };
export type AttributionInput = { campaignId: string; customerId: string };

/**
 * Números de marketing, TODOS calculados (nada digitado à mão além do que a plataforma de anúncios informa).
 * - contatos: pessoas diferentes ligadas à campanha;
 * - clientes: dessas, as que já pagaram algo (receita recebida > 0);
 * - receita: soma do que essas pessoas já pagaram;
 * - custo por contato/cliente = investimento ÷ contatos/clientes; ROI = (receita − investimento) ÷ investimento.
 */
export function statsFor(metrics: MetricInput[], attributions: AttributionInput[], revenueByCustomer: Map<string, number>): CampaignStats {
  const people = [...new Set(attributions.map((a) => a.customerId))];
  const paying = people.filter((id) => (revenueByCustomer.get(id) ?? 0) > 0);
  const spend = sumCents(metrics.map((m) => m.spend));
  const revenue = sumCents(people.map((id) => revenueByCustomer.get(id) ?? 0));
  return {
    spend,
    reach: metrics.reduce((s, m) => s + m.reach, 0),
    impressions: metrics.reduce((s, m) => s + m.impressions, 0),
    clicks: metrics.reduce((s, m) => s + m.clicks, 0),
    conversations: metrics.reduce((s, m) => s + m.conversations, 0),
    contacts: people.length,
    clients: paying.length,
    revenue,
    costPerContact: divideCents(spend, people.length),
    costPerClient: divideCents(spend, paying.length),
    conversion: percent(paying.length, people.length),
    roi: roiPercent(revenue, spend),
  };
}

export function statsByCampaign(
  campaignIds: string[],
  metrics: MetricInput[],
  attributions: AttributionInput[],
  revenueByCustomer: Map<string, number>,
): Map<string, CampaignStats> {
  return new Map(
    campaignIds.map((id) => [
      id,
      statsFor(
        metrics.filter((m) => m.campaignId === id),
        attributions.filter((a) => a.campaignId === id),
        revenueByCustomer,
      ),
    ]),
  );
}
