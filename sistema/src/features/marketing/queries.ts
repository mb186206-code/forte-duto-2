import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fromDbAmount } from "@/lib/money";
import { spParts } from "@/lib/dates";
import { statsByCampaign, statsFor, type AttributionInput, type MetricInput } from "./stats";
import type { AdRow, AttributionLookups, AttributionRow, AttributionType, CampaignRow, CampaignStats, CampaignStatus, ContactRow, MetricRow, OriginSummary } from "./types";
import { ATTRIBUTION_SHORT } from "./types";

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Não foi possível carregar ${what}: ${res.error.message}`);
  return res.data as T;
}

export type Range = { from: string; to: string } | null; // null = tudo
const inRange = (date: string, r: Range) => !r || (date >= r.from && date <= r.to);

type RawCampaign = {
  id: string; name: string; platform: string; status: CampaignStatus; service_type_id: string | null; start_date: string | null; end_date: string | null;
  planned_budget: number | null; utm_campaign: string | null; notes: string | null; service_type: { name: string } | null;
};
const CAMPAIGN_SELECT = "id,name,platform,status,service_type_id,start_date,end_date,planned_budget,utm_campaign,notes,service_type:service_types(name)";

/** Recebido (receitas efetivadas) por cliente: base de "quem virou cliente" e da receita das campanhas. */
async function revenueByCustomer(): Promise<Map<string, number>> {
  const db = await createClient();
  const res = await db.from("transactions").select("customer_id,amount").eq("kind", "receita").eq("status", "efetivado").not("customer_id", "is", null).limit(20000);
  const m = new Map<string, number>();
  for (const r of must(res, "os recebimentos")) m.set(r.customer_id!, (m.get(r.customer_id!) ?? 0) + fromDbAmount(r.amount));
  return m;
}

async function loadMetrics(range: Range, campaignId?: string): Promise<(MetricInput & { periodStart: string })[]> {
  const db = await createClient();
  let q = db.from("campaign_metrics").select("campaign_id,period_start,spend,reach,impressions,clicks,conversations").limit(10000);
  if (campaignId) q = q.eq("campaign_id", campaignId);
  return must(await q, "os números das campanhas")
    .filter((m) => inRange(m.period_start, range))
    .map((m) => ({ campaignId: m.campaign_id, periodStart: m.period_start, spend: fromDbAmount(m.spend), reach: m.reach, impressions: m.impressions, clicks: m.clicks, conversations: m.conversations }));
}

async function loadAttributions(range: Range, campaignId?: string): Promise<(AttributionInput & { type: AttributionType; occurredAt: string; adId: string | null })[]> {
  const db = await createClient();
  let q = db.from("customer_attributions").select("campaign_id,customer_id,attribution_type,occurred_at,advertisement_id").not("campaign_id", "is", null).limit(20000);
  if (campaignId) q = q.eq("campaign_id", campaignId);
  return must(await q, "os contatos das campanhas")
    .filter((a) => inRange(spParts(a.occurred_at)?.date ?? "", range))
    .map((a) => ({ campaignId: a.campaign_id!, customerId: a.customer_id, type: a.attribution_type as AttributionType, occurredAt: a.occurred_at, adId: a.advertisement_id }));
}

const toCampaign = (r: RawCampaign, stats: CampaignStats): CampaignRow => ({
  id: r.id, name: r.name, platform: r.platform, status: r.status, serviceTypeId: r.service_type_id, serviceTypeName: r.service_type?.name ?? null,
  startDate: r.start_date, endDate: r.end_date, plannedBudget: r.planned_budget === null ? null : fromDbAmount(r.planned_budget), utmCampaign: r.utm_campaign, notes: r.notes, stats,
});

export async function getMarketingOverview(range: Range): Promise<{ campaigns: CampaignRow[]; total: CampaignStats; origins: OriginSummary }> {
  const db = await createClient();
  const [camps, metrics, attrs, revenue] = await Promise.all([
    db.from("campaigns").select(CAMPAIGN_SELECT).order("created_at", { ascending: false }).limit(500),
    loadMetrics(range),
    loadAttributions(range),
    revenueByCustomer(),
  ]);
  const raw = must(camps, "as campanhas") as unknown as RawCampaign[];
  const byCampaign = statsByCampaign(raw.map((c) => c.id), metrics, attrs, revenue);
  const total = statsFor(metrics, attrs, revenue);

  // Origem dos clientes cadastrados no período (declarada × rastreada × desconhecida × sem informação)
  const [custs, prim, sources] = await Promise.all([
    db.from("customers").select("id,created_at,source_id").limit(20000),
    db.from("customer_attributions").select("customer_id,attribution_type").eq("is_primary", true).limit(20000),
    db.from("customer_sources").select("id,name,is_paid_ads").order("sort_order"),
  ]);
  const customers = must(custs, "os clientes").filter((c) => inRange(spParts(c.created_at)?.date ?? "", range));
  const typeOf = new Map(must(prim, "as origens").map((a) => [a.customer_id, a.attribution_type as AttributionType]));
  const counts = { declarada: 0, rastreada: 0, desconhecida: 0, nenhuma: 0 };
  const bySourceCount = new Map<string, number>();
  for (const c of customers) {
    counts[typeOf.get(c.id) ?? "nenhuma"]++;
    if (c.source_id) bySourceCount.set(c.source_id, (bySourceCount.get(c.source_id) ?? 0) + 1);
  }
  const origins: OriginSummary = {
    newCustomers: customers.length,
    byType: [
      { type: "rastreada", label: ATTRIBUTION_SHORT.rastreada, count: counts.rastreada },
      { type: "declarada", label: ATTRIBUTION_SHORT.declarada, count: counts.declarada },
      { type: "desconhecida", label: ATTRIBUTION_SHORT.desconhecida, count: counts.desconhecida },
      { type: "nenhuma", label: "Sem informação", count: counts.nenhuma },
    ],
    bySource: must(sources, "as origens")
      .map((s) => ({ name: s.name, paid: s.is_paid_ads, count: bySourceCount.get(s.id) ?? 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count),
  };

  return { campaigns: raw.map((r) => toCampaign(r, byCampaign.get(r.id)!)), total, origins };
}

export async function getCampaign(id: string, range: Range = null): Promise<CampaignRow | null> {
  const db = await createClient();
  const res = await db.from("campaigns").select(CAMPAIGN_SELECT).eq("id", id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) return null;
  const [metrics, attrs, revenue] = await Promise.all([loadMetrics(range, id), loadAttributions(range, id), revenueByCustomer()]);
  return toCampaign(res.data as unknown as RawCampaign, statsFor(metrics, attrs, revenue));
}

export async function listAds(campaignId: string): Promise<AdRow[]> {
  const db = await createClient();
  const res = await db.from("advertisements").select("id,campaign_id,name,format,utm_content,destination_url,notes").eq("campaign_id", campaignId).order("created_at");
  return must(res, "os anúncios").map((a) => ({ id: a.id, campaignId: a.campaign_id, name: a.name, format: a.format, utmContent: a.utm_content, destinationUrl: a.destination_url, notes: a.notes }));
}

export async function listMetrics(campaignId: string): Promise<MetricRow[]> {
  const db = await createClient();
  const res = await db
    .from("campaign_metrics")
    .select("id,advertisement_id,period_start,period_end,reach,impressions,clicks,conversations,spend,notes,ad:advertisements(name)")
    .eq("campaign_id", campaignId)
    .order("period_start", { ascending: false });
  return (must(res, "os números") as unknown as (Record<string, unknown> & { ad: { name: string } | null })[]).map((m) => ({
    id: m.id as string, advertisementId: m.advertisement_id as string | null, adName: m.ad?.name ?? null, periodStart: m.period_start as string, periodEnd: m.period_end as string,
    reach: m.reach as number, impressions: m.impressions as number, clicks: m.clicks as number, conversations: m.conversations as number, spend: fromDbAmount(m.spend as number), notes: m.notes as string | null,
  }));
}

export async function listCampaignContacts(campaignId: string): Promise<ContactRow[]> {
  const db = await createClient();
  const [res, revenue] = await Promise.all([
    db.from("customer_attributions").select("customer_id,attribution_type,occurred_at,customer:customers(name),ad:advertisements(name)").eq("campaign_id", campaignId).order("occurred_at", { ascending: false }).limit(500),
    revenueByCustomer(),
  ]);
  return (must(res, "os contatos") as unknown as { customer_id: string; attribution_type: AttributionType; occurred_at: string; customer: { name: string } | null; ad: { name: string } | null }[]).map((r) => ({
    customerId: r.customer_id, name: r.customer?.name ?? "—", type: r.attribution_type, adName: r.ad?.name ?? null, date: spParts(r.occurred_at)?.date ?? "", revenue: revenue.get(r.customer_id) ?? 0,
  }));
}

export async function getAttributionLookups(): Promise<AttributionLookups> {
  const db = await createClient();
  const [c, a] = await Promise.all([
    db.from("campaigns").select("id,name,platform,utm_campaign").order("created_at", { ascending: false }).limit(500),
    db.from("advertisements").select("id,campaign_id,name").order("created_at").limit(2000),
  ]);
  return {
    campaigns: must(c, "as campanhas").map((x) => ({ id: x.id, name: x.name, platform: x.platform, utmCampaign: x.utm_campaign })),
    ads: must(a, "os anúncios").map((x) => ({ id: x.id, campaignId: x.campaign_id, name: x.name })),
  };
}

export async function getPrimaryAttribution(customerId: string): Promise<AttributionRow | null> {
  const db = await createClient();
  const res = await db
    .from("customer_attributions")
    .select("id,attribution_type,campaign_id,advertisement_id,utm_source,utm_medium,utm_campaign,utm_content,click_id,notes,occurred_at,campaign:campaigns(name),ad:advertisements(name)")
    .eq("customer_id", customerId)
    .eq("is_primary", true)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  const r = res.data as unknown as (Record<string, unknown> & { campaign: { name: string } | null; ad: { name: string } | null }) | null;
  if (!r) return null;
  return {
    id: r.id as string, type: r.attribution_type as AttributionType, campaignId: r.campaign_id as string | null, campaignName: r.campaign?.name ?? null,
    advertisementId: r.advertisement_id as string | null, adName: r.ad?.name ?? null, utmSource: r.utm_source as string | null, utmMedium: r.utm_medium as string | null,
    utmCampaign: r.utm_campaign as string | null, utmContent: r.utm_content as string | null, clickId: r.click_id as string | null, notes: r.notes as string | null, occurredAt: r.occurred_at as string,
  };
}

