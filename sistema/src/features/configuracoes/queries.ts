import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ListItem = { id: string; name: string; active: boolean; classification?: string; paid?: boolean };

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Não foi possível carregar ${what}: ${res.error.message}`);
  return res.data as T;
}

export async function getLists() {
  const db = await createClient();
  const [exp, rev, pay, svc, src] = await Promise.all([
    db.from("expense_categories").select("id,name,active,classification").order("sort_order"),
    db.from("revenue_categories").select("id,name,active").order("sort_order"),
    db.from("payment_methods").select("id,name,active").order("sort_order"),
    db.from("service_types").select("id,name,active").order("sort_order"),
    db.from("customer_sources").select("id,name,active,is_paid_ads").order("sort_order"),
  ]);
  return {
    despesa: must(exp, "os tipos de despesa").map((r): ListItem => ({ id: r.id, name: r.name, active: r.active, classification: r.classification })),
    entrada: must(rev, "os tipos de entrada").map((r): ListItem => ({ id: r.id, name: r.name, active: r.active })),
    pagamento: must(pay, "as formas de pagamento").map((r): ListItem => ({ id: r.id, name: r.name, active: r.active })),
    servico: must(svc, "os tipos de serviço").map((r): ListItem => ({ id: r.id, name: r.name, active: r.active })),
    origem: must(src, "as origens").map((r): ListItem => ({ id: r.id, name: r.name, active: r.active, paid: r.is_paid_ads })),
  };
}

export async function getAuditLogs(table: string | null, limit = 150) {
  const db = await createClient();
  let q = db.from("audit_logs").select("id,table_name,record_id,action,old_data,new_data,changed_by,changed_at").order("changed_at", { ascending: false }).limit(limit);
  if (table) q = q.eq("table_name", table);
  return must(await q, "o histórico");
}
