/** Texto simples para o histórico de alterações (quem fez o quê, em linguagem do dia a dia). */

export const TABLE_LABEL: Record<string, string> = {
  transactions: "lançamento", accounts: "conta", funds: "fundo", fund_movements: "movimento de fundo",
  customers: "cliente", services: "serviço", service_items: "custo de serviço", budgets: "orçamento", budget_items: "item de orçamento",
  campaigns: "campanha", advertisements: "anúncio", campaign_metrics: "números de campanha", customer_attributions: "origem do cliente",
  attachments: "foto/arquivo", company_settings: "dados da empresa", expense_categories: "tipo de despesa", revenue_categories: "tipo de entrada",
  payment_methods: "forma de pagamento", service_types: "tipo de serviço", customer_sources: "origem de cliente",
};

const FIELD_LABEL: Record<string, string> = {
  name: "nome", description: "descrição", amount: "valor", status: "situação", phone: "telefone", whatsapp: "WhatsApp", address: "endereço", notes: "observação",
  contract_value: "valor combinado", scheduled_at: "dia marcado", completed_at: "conclusão", responsible_name: "responsável", discount: "desconto", valid_until: "validade",
  settled_date: "dia do pagamento", competence_date: "data", due_date: "vencimento", account_id: "conta", spend: "gasto", active: "ativo", company_name: "nome da empresa",
  monthly_revenue_goal: "meta de faturamento", monthly_profit_goal: "meta de lucro", target_amount: "meta", utm_campaign: "código do link", platform: "plataforma",
  customer_id: "cliente", service_id: "serviço", quantity: "quantidade", unit_cost: "valor unitário", unit_price: "valor unitário", kind: "tipo", is_paid_ads: "é anúncio",
  estimated_value: "valor estimado", source_id: "como conheceu", attribution_type: "tipo de origem",
};

const IGNORED = new Set(["updated_at", "created_at", "created_by", "phone_digits", "total", "number"]);
type Json = Record<string, unknown> | null;

export type AuditRow = { id: number; table_name: string; record_id: string | null; action: "INSERT" | "UPDATE" | "DELETE"; old_data: Json; new_data: Json; changed_by: string; changed_at: string };

function title(d: Json): string {
  if (!d) return "";
  const v = d.name ?? d.description ?? d.company_name ?? d.file_name;
  return typeof v === "string" ? v : "";
}

export function changedFields(oldD: Json, newD: Json): string[] {
  if (!oldD || !newD) return [];
  return Object.keys(newD)
    .filter((k) => !IGNORED.has(k) && JSON.stringify(oldD[k]) !== JSON.stringify(newD[k]))
    .map((k) => FIELD_LABEL[k] ?? k.replace(/_/g, " "));
}

export function describeAudit(r: AuditRow): { verb: string; what: string; detail: string } {
  const what = TABLE_LABEL[r.table_name] ?? r.table_name;
  const t = title(r.new_data) || title(r.old_data);
  if (r.action === "INSERT") return { verb: "criou", what, detail: t };
  if (r.action === "DELETE") return { verb: "apagou", what, detail: t };
  const fields = changedFields(r.old_data, r.new_data);
  return { verb: "alterou", what, detail: [t, fields.length ? `(${fields.join(", ")})` : ""].filter(Boolean).join(" ") };
}
