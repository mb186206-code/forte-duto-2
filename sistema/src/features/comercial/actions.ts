"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";
import { fieldErrors, formToObject } from "@/lib/validation/financeiro";
import {
  budgetItemSchema, budgetSchema, budgetStatusSchema, costItemSchema, customerSchema, servicePaymentSchema, serviceSchema, serviceStatusSchema,
} from "@/lib/validation/comercial";
import { toSpInstant } from "@/lib/dates";
import { dbNum } from "@/features/financeiro/queries";
import { z } from "zod";

const fail = (message: string): FormState => ({ status: "error", message });
const ok = (message: string): FormState => ({ status: "success", message });
const invalid = (e: z.ZodError): FormState => ({ status: "error", fieldErrors: fieldErrors(e) });
const GENERIC = "Não foi possível salvar agora. Tente de novo.";

function refreshAll() {
  for (const p of ["/clientes", "/servicos", "/orcamentos", "/financeiro", "/dashboard", "/marketing", "/relatorios"]) revalidatePath(p);
}

const digitsOf = (s?: string | null) => (s ?? "").replace(/\D/g, "");

// ================================================================== clientes
export async function saveCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = customerSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();

  // Telefone repetido: avisa de quem é, em vez de criar cliente duplicado.
  const digits = digitsOf(v.whatsapp || v.phone);
  if (digits.length >= 8) {
    let q = db.from("customers").select("id,name").eq("phone_digits", digits);
    if (v.id) q = q.neq("id", v.id);
    const dup = await q.maybeSingle();
    if (dup.data) {
      const field = v.whatsapp ? "whatsapp" : "phone";
      return { status: "error", fieldErrors: { [field]: `Esse número já é do cliente ${dup.data.name}.` } };
    }
  }

  const row = {
    name: v.name,
    phone: v.phone ?? null,
    whatsapp: v.whatsapp ?? null,
    address: v.address ?? null,
    requested_service: v.requestedService ?? null,
    estimated_value: v.estimatedValue === null ? null : dbNum(v.estimatedValue),
    source_id: v.sourceId ?? null,
    status: v.status,
    notes: v.notes ?? null,
  };
  const res = v.id ? await db.from("customers").update(row).eq("id", v.id) : await db.from("customers").insert(row);
  if (res.error) return res.error.code === "23505" ? { status: "error", fieldErrors: { phone: "Esse número já está cadastrado." } } : fail(GENERIC);
  refreshAll();
  return ok(v.id ? "Cliente atualizado." : "Cliente cadastrado.");
}

export async function deleteCustomer(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("customers").delete().eq("id", id);
  if (res.error) {
    return fail(res.error.code === "23503" ? "Esse cliente tem serviços, orçamentos ou pagamentos. Marque como inativo em vez de apagar." : GENERIC);
  }
  refreshAll();
  return ok("Cliente apagado.");
}

// ================================================================== serviços
function serviceRow(v: z.infer<typeof serviceSchema>) {
  return {
    customer_id: v.customerId,
    service_type_id: v.serviceTypeId ?? null,
    description: v.description ?? null,
    address: v.address ?? null,
    responsible_name: v.responsibleName ?? null,
    scheduled_at: v.scheduledDate ? toSpInstant(v.scheduledDate, v.scheduledTime) : null,
    contract_value: v.contractValue === null ? null : dbNum(v.contractValue),
    status: v.status,
    completed_at: v.status === "concluido" ? new Date().toISOString() : null,
    notes: v.notes ?? null,
  };
}

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = serviceSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const row = serviceRow(v);
  if (!row.address) {
    const c = await db.from("customers").select("address").eq("id", v.customerId).maybeSingle();
    row.address = c.data?.address ?? null;
  }
  if (!v.id && row.status === "solicitado" && v.scheduledDate) row.status = "agendado";
  if (v.id) {
    // não mexe em completed_at de quem já estava concluído
    const { completed_at, ...rest } = row;
    const res = await db.from("services").update(v.status === "concluido" ? { ...rest, completed_at } : rest).eq("id", v.id);
    if (res.error) return fail(GENERIC);
  } else {
    const res = await db.from("services").insert(row);
    if (res.error) return fail(GENERIC);
  }
  refreshAll();
  return ok(v.id ? "Serviço atualizado." : "Serviço anotado.");
}

export async function setServiceStatus(id: string, status: string): Promise<FormState> {
  const parsed = serviceStatusSchema.safeParse({ id, status });
  if (!parsed.success) return fail("Situação inválida.");
  const db = await createClient();
  const res = await db
    .from("services")
    .update({ status: parsed.data.status, completed_at: parsed.data.status === "concluido" ? new Date().toISOString() : null })
    .eq("id", id);
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok("Situação atualizada.");
}

export async function deleteService(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("services").delete().eq("id", id);
  if (res.error) return fail(res.error.code === "23503" ? "Esse serviço tem pagamentos anotados. Cancele o serviço em vez de apagar." : GENERIC);
  refreshAll();
  return ok("Serviço apagado.");
}

export async function addCostItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = costItemSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const res = await db.from("service_items").insert({ service_id: v.serviceId, kind: v.kind, description: v.description, quantity: v.quantity, unit_cost: dbNum(v.unitCost) });
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok("Custo anotado.");
}

export async function removeCostItem(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("service_items").delete().eq("id", id);
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok("Custo removido.");
}

/** Cobrança do serviço: vira uma ENTRADA no financeiro (recebida, ou a receber). Concluir o serviço não gera pagamento sozinho. */
export async function addServicePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = servicePaymentSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const svc = await db.from("services").select("customer_id,description,type:service_types(name)").eq("id", v.serviceId).maybeSingle();
  if (!svc.data) return fail("Serviço não encontrado.");
  const typeName = (svc.data.type as unknown as { name: string } | null)?.name;
  const res = await db.from("transactions").insert({
    kind: "receita",
    status: v.done ? "efetivado" : "pendente",
    description: `Pagamento — ${typeName ?? svc.data.description?.slice(0, 60) ?? "serviço"}`,
    amount: dbNum(v.amount),
    competence_date: v.date,
    due_date: v.done ? null : v.date,
    settled_date: v.done ? v.date : null,
    account_id: v.accountId ?? null,
    payment_method_id: v.paymentMethodId ?? null,
    customer_id: svc.data.customer_id,
    service_id: v.serviceId,
  });
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok(v.done ? "Pagamento recebido." : "Pagamento anotado como a receber.");
}

/** Foto do serviço (já reduzida no celular). Fica no armazenamento privado e é lida por link temporário. */
export async function uploadServicePhoto(formData: FormData): Promise<FormState> {
  const serviceId = z.uuid().safeParse(formData.get("serviceId"));
  const category = z.enum(["foto_antes", "foto_depois", "documento"]).safeParse(formData.get("category"));
  const file = formData.get("file");
  if (!serviceId.success || !category.success) return fail("Dados inválidos.");
  if (!(file instanceof File) || file.size === 0) return fail("Escolha uma foto.");
  if (file.size > 4 * 1024 * 1024) return fail("A foto é grande demais (máximo 4 MB).");
  const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
  const ext = allowed[file.type];
  if (!ext) return fail("Use uma foto (JPG, PNG) ou PDF.");

  const db = await createClient();
  const path = `service/${serviceId.data}/${randomUUID()}.${ext}`;
  const up = await db.storage.from("anexos").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return fail("Não foi possível enviar a foto agora. Tente de novo.");
  const ins = await db.from("attachments").insert({
    entity_type: "service", entity_id: serviceId.data, category: category.data, storage_path: path,
    file_name: (file.name || `foto.${ext}`).slice(0, 255), mime_type: file.type, size_bytes: file.size,
  });
  if (ins.error) {
    await db.storage.from("anexos").remove([path]);
    return fail(GENERIC);
  }
  revalidatePath(`/servicos/${serviceId.data}`);
  return ok("Foto salva.");
}

export async function deleteAttachment(id: string, serviceId: string): Promise<FormState> {
  const db = await createClient();
  const row = await db.from("attachments").select("storage_path").eq("id", id).maybeSingle();
  if (!row.data) return fail("Arquivo não encontrado.");
  const del = await db.from("attachments").delete().eq("id", id);
  if (del.error) return fail(GENERIC);
  await db.storage.from("anexos").remove([row.data.storage_path]);
  revalidatePath(`/servicos/${serviceId}`);
  return ok("Foto apagada.");
}

// ================================================================ orçamentos
export async function saveBudget(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = budgetSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const row = {
    customer_id: v.customerId,
    service_type_id: v.serviceTypeId ?? null,
    description: v.description ?? null,
    address: v.address ?? null,
    issue_date: v.issueDate,
    valid_until: v.validUntil ?? null,
    discount: v.discount === null ? 0 : dbNum(v.discount),
    notes: v.notes ?? null,
  };
  if (v.id) {
    const res = await db.from("budgets").update(row).eq("id", v.id);
    if (res.error) return fail(GENERIC);
    refreshAll();
    return ok("Orçamento atualizado.");
  }
  const res = await db.from("budgets").insert(row).select("id").single();
  if (res.error || !res.data) return fail(GENERIC);
  refreshAll();
  // Vai direto para o orçamento, onde se colocam os itens.
  redirect(`/orcamentos/${res.data.id}`);
}

export async function addBudgetItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = budgetItemSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const db = await createClient();
  const b = await db.from("budgets").select("status,service_id").eq("id", v.budgetId).maybeSingle();
  if (b.data?.service_id) return fail("Esse orçamento já virou serviço e não pode mais mudar.");
  const res = await db.from("budget_items").insert({ budget_id: v.budgetId, kind: v.kind, description: v.description, quantity: v.quantity, unit_price: dbNum(v.unitPrice) });
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok("Item adicionado.");
}

export async function removeBudgetItem(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("budget_items").delete().eq("id", id);
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok("Item removido.");
}

export async function setBudgetStatus(id: string, status: string): Promise<FormState> {
  const parsed = budgetStatusSchema.safeParse({ id, status });
  if (!parsed.success) return fail("Situação inválida.");
  const db = await createClient();
  const b = await db.from("budgets").select("service_id").eq("id", id).maybeSingle();
  if (b.data?.service_id) return fail("Esse orçamento já virou serviço.");
  const res = await db.from("budgets").update({ status: parsed.data.status }).eq("id", id);
  if (res.error) return fail(GENERIC);
  refreshAll();
  return ok(parsed.data.status === "aprovado" ? "Orçamento aprovado." : "Situação atualizada.");
}

/** Orçamento aprovado → serviço (um clique). Aprovar um orçamento NÃO é dinheiro recebido. */
export async function convertBudget(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.rpc("convert_budget_to_service", { p_budget_id: id });
  if (res.error || !res.data) return fail(res.error?.message && res.error.code === "P0001" ? res.error.message : GENERIC);
  refreshAll();
  redirect(`/servicos/${res.data}`);
}

export async function deleteBudget(id: string): Promise<FormState> {
  const db = await createClient();
  const b = await db.from("budgets").select("service_id").eq("id", id).maybeSingle();
  if (b.data?.service_id) return fail("Esse orçamento já virou serviço e não pode ser apagado.");
  const res = await db.from("budgets").delete().eq("id", id);
  if (res.error) return fail(GENERIC);
  refreshAll();
  redirect("/orcamentos");
}
