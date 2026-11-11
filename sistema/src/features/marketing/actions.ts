"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";
import { fieldErrors, formToObject } from "@/lib/validation/financeiro";
import { adSchema, attributionSchema, campaignSchema, metricSchema } from "@/lib/validation/marketing";
import { slugify } from "@/lib/utm";
import { dbNum } from "@/features/financeiro/queries";

const fail = (message: string): FormState => ({ status: "error", message });
const ok = (message: string): FormState => ({ status: "success", message });
const invalid = (e: z.ZodError): FormState => ({ status: "error", fieldErrors: fieldErrors(e) });
const GENERIC = "Não foi possível salvar agora. Tente de novo.";

function refresh(id?: string) {
  revalidatePath("/marketing");
  revalidatePath("/clientes");
  revalidatePath("/relatorios");
  if (id) revalidatePath(`/marketing/${id}`);
}

export async function saveCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = campaignSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const row = {
    name: v.name,
    platform: v.platform,
    status: v.status,
    service_type_id: v.serviceTypeId ?? null,
    start_date: v.startDate ?? null,
    end_date: v.endDate ?? null,
    planned_budget: v.plannedBudget === null ? null : dbNum(v.plannedBudget),
    utm_campaign: v.utmCampaign ?? (slugify(v.name) || null),
    notes: v.notes ?? null,
  };
  const dupMsg: FormState = { status: "error", fieldErrors: { utmCampaign: "Esse código de link já é de outra campanha. Troque por outro." } };
  if (v.id) {
    const res = await db.from("campaigns").update(row).eq("id", v.id);
    if (res.error) return res.error.code === "23505" ? dupMsg : fail(GENERIC);
    refresh(v.id);
    return ok("Campanha atualizada.");
  }
  const res = await db.from("campaigns").insert(row).select("id").single();
  if (res.error || !res.data) return res.error?.code === "23505" ? dupMsg : fail(GENERIC);
  refresh();
  redirect(`/marketing/${res.data.id}`);
}

export async function deleteCampaign(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("campaigns").delete().eq("id", id);
  if (res.error) return fail(res.error.code === "23503" ? "Essa campanha tem pagamentos ligados a ela e não pode ser apagada. Marque como encerrada." : GENERIC);
  refresh();
  redirect("/marketing");
}

export async function saveAd(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = adSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const row = {
    campaign_id: v.campaignId,
    name: v.name,
    format: v.format ?? null,
    utm_content: v.utmContent ?? (slugify(v.name) || null),
    destination_url: v.destinationUrl ?? null,
    notes: v.notes ?? null,
  };
  const res = v.id ? await db.from("advertisements").update(row).eq("id", v.id) : await db.from("advertisements").insert(row);
  if (res.error) return res.error.code === "23505" ? { status: "error", fieldErrors: { utmContent: "Esse código já é de outro anúncio desta campanha." } } : fail(GENERIC);
  refresh(v.campaignId);
  return ok(v.id ? "Anúncio atualizado." : "Anúncio criado.");
}

export async function deleteAd(id: string, campaignId: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("advertisements").delete().eq("id", id);
  if (res.error) return fail(GENERIC);
  refresh(campaignId);
  return ok("Anúncio apagado.");
}

/** Números que a plataforma de anúncios informa (alcance, cliques, conversas e quanto foi gasto). */
export async function saveMetric(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = metricSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const res = await db.from("campaign_metrics").insert({
    campaign_id: v.campaignId,
    advertisement_id: v.advertisementId ?? null,
    period_start: v.periodStart,
    period_end: v.periodEnd,
    spend: v.spend === null ? 0 : dbNum(v.spend),
    reach: v.reach,
    impressions: v.impressions,
    clicks: v.clicks,
    conversations: v.conversations,
    notes: v.notes ?? null,
  });
  if (res.error) return res.error.code === "23505" ? fail("Você já lançou números para esse mesmo período. Apague o lançamento antigo para refazer.") : fail(GENERIC);
  refresh(v.campaignId);
  return ok("Números lançados.");
}

export async function deleteMetric(id: string, campaignId: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("campaign_metrics").delete().eq("id", id);
  if (res.error) return fail(GENERIC);
  refresh(campaignId);
  return ok("Lançamento apagado.");
}

/** Como o cliente chegou: troca a origem principal dele. */
export async function saveAttribution(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = attributionSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();

  let utmCampaign = v.utmCampaign ?? null;
  let adContent = v.utmContent ?? null;
  if (v.type === "rastreada" && v.campaignId && !utmCampaign) {
    utmCampaign = (await db.from("campaigns").select("utm_campaign,name").eq("id", v.campaignId).maybeSingle()).data?.utm_campaign ?? null;
  }
  if (v.advertisementId && !adContent) {
    adContent = (await db.from("advertisements").select("utm_content").eq("id", v.advertisementId).maybeSingle()).data?.utm_content ?? null;
  }
  if (v.type === "rastreada" && !utmCampaign && !v.utmSource && !v.clickId) {
    return { status: "error", fieldErrors: { campaignId: "Essa campanha não tem código de link. Edite a campanha ou preencha os dados do link." } };
  }

  // só existe uma origem principal por cliente: troca a anterior
  const del = await db.from("customer_attributions").delete().eq("customer_id", v.customerId).eq("is_primary", true);
  if (del.error) return fail(GENERIC);
  const ins = await db.from("customer_attributions").insert({
    customer_id: v.customerId,
    campaign_id: v.type === "desconhecida" ? null : (v.campaignId ?? null),
    advertisement_id: v.type === "desconhecida" ? null : (v.advertisementId ?? null),
    attribution_type: v.type,
    utm_source: v.type === "rastreada" ? (v.utmSource ?? null) : null,
    utm_medium: v.type === "rastreada" ? (v.utmMedium ?? null) : null,
    utm_campaign: v.type === "rastreada" ? utmCampaign : null,
    utm_content: v.type === "rastreada" ? adContent : null,
    click_id: v.type === "rastreada" ? (v.clickId ?? null) : null,
    notes: v.notes ?? null,
    is_primary: true,
  });
  if (ins.error) return fail(GENERIC);
  refresh();
  revalidatePath(`/clientes/${v.customerId}`);
  return ok("Origem do cliente salva.");
}

export async function clearAttribution(customerId: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("customer_attributions").delete().eq("customer_id", customerId).eq("is_primary", true);
  if (res.error) return fail(GENERIC);
  refresh();
  revalidatePath(`/clientes/${customerId}`);
  return ok("Origem removida.");
}
