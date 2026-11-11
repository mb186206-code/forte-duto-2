"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";
import { fieldErrors, formToObject } from "@/lib/validation/financeiro";
import { companySchema, listItemSchema, LIST_KEYS, type ListKey } from "@/lib/validation/configuracoes";
import { dbNum } from "@/features/financeiro/queries";

const fail = (message: string): FormState => ({ status: "error", message });
const GENERIC = "Não foi possível salvar agora. Tente de novo.";

function refresh() {
  for (const p of ["/configuracoes", "/financeiro", "/clientes", "/servicos", "/orcamentos", "/marketing", "/relatorios"]) revalidatePath(p);
}

export async function saveCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = companySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();
  const res = await db
    .from("company_settings")
    .update({
      company_name: v.companyName,
      legal_name: v.legalName ?? null,
      document: v.document ?? null,
      phone: v.phone ?? null,
      whatsapp: v.whatsapp ?? null,
      email: v.email ?? null,
      address: v.address ?? null,
      monthly_revenue_goal: v.monthlyRevenueGoal === null ? null : dbNum(v.monthlyRevenueGoal),
      monthly_profit_goal: v.monthlyProfitGoal === null ? null : dbNum(v.monthlyProfitGoal),
    })
    .eq("id", true);
  if (res.error) return fail(GENERIC);
  refresh();
  return { status: "success", message: "Dados da empresa salvos." };
}

const TABLE = {
  despesa: "expense_categories",
  entrada: "revenue_categories",
  pagamento: "payment_methods",
  servico: "service_types",
  origem: "customer_sources",
} as const satisfies Record<ListKey, string>;

/** Cria ou renomeia um item das listas (tipos de despesa, formas de pagamento, etc.). */
export async function saveListItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = listItemSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();
  const table = TABLE[v.list];

  const extra: Record<string, unknown> = {};
  if (v.list === "despesa" && v.classification) extra.classification = v.classification;
  if (v.list === "origem") extra.is_paid_ads = v.paid;

  let error;
  if (v.id) {
    ({ error } = await db.from(table).update({ name: v.name, ...extra }).eq("id", v.id));
  } else {
    const last = await db.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    ({ error } = await db.from(table).insert({ name: v.name, sort_order: (last.data?.sort_order ?? 0) + 1, ...extra } as never));
  }
  if (error) return error.code === "23505" ? { status: "error", fieldErrors: { name: "Já existe um item com esse nome." } } : fail(GENERIC);
  refresh();
  return { status: "success", message: v.id ? "Salvo." : "Adicionado." };
}

/** Esconde ou mostra um item (não apaga, para não perder o histórico de quem já usou). */
export async function setListItemActive(list: string, id: string, active: boolean): Promise<FormState> {
  if (!(LIST_KEYS as readonly string[]).includes(list)) return fail("Lista inválida.");
  const db = await createClient();
  const res = await db.from(TABLE[list as ListKey]).update({ active }).eq("id", id);
  if (res.error) return fail(GENERIC);
  refresh();
  return { status: "success", message: active ? "Voltou a aparecer." : "Escondido das listas." };
}
