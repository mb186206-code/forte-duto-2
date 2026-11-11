import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fromDbAmount } from "@/lib/money";
import type {
  AttachmentRow, BudgetRow, BudgetStatus, CommercialLookups, CustomerRow, CustomerStatus, ItemKind, LineItem, PaymentRow, ServiceRow, ServiceStatus,
} from "./types";

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Não foi possível carregar ${what}: ${res.error.message}`);
  return res.data as T;
}

export async function getCommercialLookups(): Promise<CommercialLookups> {
  const db = await createClient();
  const [cust, types, sources] = await Promise.all([
    db.from("customers").select("id,name,phone,whatsapp").order("name").limit(1000),
    db.from("service_types").select("id,name").eq("active", true).order("sort_order"),
    db.from("customer_sources").select("id,name").eq("active", true).order("sort_order"),
  ]);
  return {
    customers: must(cust, "os clientes").map((c) => ({ id: c.id, name: c.name, phone: c.whatsapp || c.phone })),
    serviceTypes: must(types, "os tipos de serviço"),
    sources: must(sources, "as origens"),
  };
}

// ---------------------------------------------------------------- clientes
const CUSTOMER_SELECT = "id,name,phone,whatsapp,address,requested_service,estimated_value,source_id,status,notes,created_at,source:customer_sources(name)";
type RawCustomer = {
  id: string; name: string; phone: string | null; whatsapp: string | null; address: string | null; requested_service: string | null;
  estimated_value: number | null; source_id: string | null; status: CustomerStatus; notes: string | null; created_at: string; source: { name: string } | null;
};
const toCustomer = (r: RawCustomer): CustomerRow => ({
  id: r.id, name: r.name, phone: r.phone, whatsapp: r.whatsapp, address: r.address, requestedService: r.requested_service,
  estimatedValue: r.estimated_value === null ? null : fromDbAmount(r.estimated_value), sourceId: r.source_id, sourceName: r.source?.name ?? null,
  status: r.status, notes: r.notes, createdAt: r.created_at,
});

export async function listCustomers(): Promise<CustomerRow[]> {
  const db = await createClient();
  const res = await db.from("customers").select(CUSTOMER_SELECT).order("created_at", { ascending: false }).limit(1000);
  return (must(res, "os clientes") as unknown as RawCustomer[]).map(toCustomer);
}

export async function getCustomer(id: string): Promise<CustomerRow | null> {
  const db = await createClient();
  const res = await db.from("customers").select(CUSTOMER_SELECT).eq("id", id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data ? toCustomer(res.data as unknown as RawCustomer) : null;
}

// ---------------------------------------------------------------- serviços
const SERVICE_SELECT =
  "id,customer_id,service_type_id,description,address,responsible_name,requested_date,scheduled_at,completed_at,contract_value,status,notes," +
  "customer:customers(name,phone,whatsapp),type:service_types(name)";
type RawService = {
  id: string; customer_id: string; service_type_id: string | null; description: string | null; address: string | null; responsible_name: string | null;
  requested_date: string; scheduled_at: string | null; completed_at: string | null; contract_value: number | null; status: ServiceStatus; notes: string | null;
  customer: { name: string; phone: string | null; whatsapp: string | null } | null; type: { name: string } | null;
};

async function toServices(raw: RawService[]): Promise<ServiceRow[]> {
  if (raw.length === 0) return [];
  const db = await createClient();
  const ids = raw.map((r) => r.id);
  const [costs, pays] = await Promise.all([
    db.from("service_costs").select("service_id,total_cost").in("service_id", ids),
    db.from("transactions").select("service_id,amount,status").eq("kind", "receita").neq("status", "cancelado").in("service_id", ids),
  ]);
  const cost = new Map(must(costs, "os custos").map((c) => [c.service_id as string, fromDbAmount(c.total_cost)]));
  const received = new Map<string, number>();
  const toReceive = new Map<string, number>();
  for (const p of must(pays, "os pagamentos")) {
    const m = p.status === "efetivado" ? received : toReceive;
    m.set(p.service_id!, (m.get(p.service_id!) ?? 0) + fromDbAmount(p.amount));
  }
  return raw.map((r) => ({
    id: r.id, customerId: r.customer_id, customerName: r.customer?.name ?? "—", customerPhone: r.customer?.whatsapp || r.customer?.phone || null,
    serviceTypeId: r.service_type_id, typeName: r.type?.name ?? null, description: r.description, address: r.address, responsibleName: r.responsible_name,
    requestedDate: r.requested_date, scheduledAt: r.scheduled_at, completedAt: r.completed_at,
    contractValue: r.contract_value === null ? null : fromDbAmount(r.contract_value), status: r.status, notes: r.notes,
    totalCost: cost.get(r.id) ?? 0, received: received.get(r.id) ?? 0, toReceive: toReceive.get(r.id) ?? 0,
  }));
}

export async function listServices(filter?: { customerId?: string }): Promise<ServiceRow[]> {
  const db = await createClient();
  let q = db.from("services").select(SERVICE_SELECT).order("scheduled_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }).limit(1000);
  if (filter?.customerId) q = q.eq("customer_id", filter.customerId);
  return toServices(must(await q, "os serviços") as unknown as RawService[]);
}

export async function getService(id: string): Promise<ServiceRow | null> {
  const db = await createClient();
  const res = await db.from("services").select(SERVICE_SELECT).eq("id", id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) return null;
  return (await toServices([res.data as unknown as RawService]))[0];
}

type RawItem = { id: string; kind: ItemKind; description: string; quantity: number; unit_cost?: number; unit_price?: number; total: number };
const toItem = (r: RawItem): LineItem => ({
  id: r.id, kind: r.kind, description: r.description, quantity: Number(r.quantity), unit: fromDbAmount(r.unit_cost ?? r.unit_price), total: fromDbAmount(r.total),
});

export async function listServiceCosts(serviceId: string): Promise<LineItem[]> {
  const db = await createClient();
  const res = await db.from("service_items").select("id,kind,description,quantity,unit_cost,total").eq("service_id", serviceId).order("sort_order").order("created_at");
  return (must(res, "os custos") as unknown as RawItem[]).map(toItem);
}

const PAY_SELECT = "id,description,amount,status,settled_date,due_date,competence_date,account:accounts!transactions_account_id_fkey(name)";
type RawPay = { id: string; description: string; amount: number; status: PaymentRow["status"]; settled_date: string | null; due_date: string | null; competence_date: string; account: { name: string } | null };
const toPay = (r: RawPay): PaymentRow => ({
  id: r.id, description: r.description, amount: fromDbAmount(r.amount), status: r.status, date: r.settled_date ?? r.due_date ?? r.competence_date, accountName: r.account?.name ?? null,
});

export async function listPayments(by: { serviceId?: string; customerId?: string }): Promise<PaymentRow[]> {
  const db = await createClient();
  let q = db.from("transactions").select(PAY_SELECT).eq("kind", "receita").neq("status", "cancelado").order("created_at", { ascending: false }).limit(200);
  if (by.serviceId) q = q.eq("service_id", by.serviceId);
  if (by.customerId) q = q.eq("customer_id", by.customerId);
  return (must(await q, "os pagamentos") as unknown as RawPay[]).map(toPay);
}

export async function listAttachments(entityType: "service" | "budget" | "customer", entityId: string): Promise<AttachmentRow[]> {
  const db = await createClient();
  const res = await db.from("attachments").select("id,category,file_name,storage_path,created_at,created_by").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at");
  const rows = must(res, "os anexos");
  if (rows.length === 0) return [];
  const signed = await db.storage.from("anexos").createSignedUrls(rows.map((r) => r.storage_path), 3600);
  const urlByPath = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({ id: r.id, category: r.category, fileName: r.file_name, url: urlByPath.get(r.storage_path) ?? null, createdAt: r.created_at, createdBy: r.created_by }));
}

// -------------------------------------------------------------- orçamentos
const BUDGET_SELECT =
  "id,number,customer_id,service_type_id,description,address,issue_date,valid_until,discount,status,service_id,notes," +
  "customer:customers(name,phone,whatsapp),type:service_types(name)";
type RawBudget = {
  id: string; number: number; customer_id: string; service_type_id: string | null; description: string | null; address: string | null; issue_date: string;
  valid_until: string | null; discount: number; status: BudgetStatus; service_id: string | null; notes: string | null;
  customer: { name: string; phone: string | null; whatsapp: string | null } | null; type: { name: string } | null;
};

async function toBudgets(raw: RawBudget[]): Promise<BudgetRow[]> {
  if (raw.length === 0) return [];
  const db = await createClient();
  const totals = await db.from("budget_totals").select("budget_id,subtotal,total").in("budget_id", raw.map((r) => r.id));
  const t = new Map(must(totals, "os totais").map((x) => [x.budget_id as string, x]));
  return raw.map((r) => ({
    id: r.id, number: r.number, customerId: r.customer_id, customerName: r.customer?.name ?? "—", customerPhone: r.customer?.whatsapp || r.customer?.phone || null,
    serviceTypeId: r.service_type_id, typeName: r.type?.name ?? null, description: r.description, address: r.address, issueDate: r.issue_date, validUntil: r.valid_until,
    discount: fromDbAmount(r.discount), status: r.status, serviceId: r.service_id, notes: r.notes,
    subtotal: fromDbAmount(t.get(r.id)?.subtotal), total: fromDbAmount(t.get(r.id)?.total),
  }));
}

export async function listBudgets(filter?: { customerId?: string }): Promise<BudgetRow[]> {
  const db = await createClient();
  let q = db.from("budgets").select(BUDGET_SELECT).order("number", { ascending: false }).limit(1000);
  if (filter?.customerId) q = q.eq("customer_id", filter.customerId);
  return toBudgets(must(await q, "os orçamentos") as unknown as RawBudget[]);
}

export async function getBudget(id: string): Promise<BudgetRow | null> {
  const db = await createClient();
  const res = await db.from("budgets").select(BUDGET_SELECT).eq("id", id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) return null;
  return (await toBudgets([res.data as unknown as RawBudget]))[0];
}

export async function listBudgetItems(budgetId: string): Promise<LineItem[]> {
  const db = await createClient();
  const res = await db.from("budget_items").select("id,kind,description,quantity,unit_price,total").eq("budget_id", budgetId).order("sort_order").order("created_at");
  return (must(res, "os itens") as unknown as RawItem[]).map(toItem);
}

export async function getBudgetForService(serviceId: string): Promise<{ id: string; number: number } | null> {
  const db = await createClient();
  const res = await db.from("budgets").select("id,number").eq("service_id", serviceId).maybeSingle();
  return res.data ?? null;
}
