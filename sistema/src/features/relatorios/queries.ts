import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fromDbAmount } from "@/lib/money";
import { monthRange, spParts } from "@/lib/dates";
import { listServices } from "@/features/comercial/queries";
import type { ServiceRow } from "@/features/comercial/types";
import type { ExpenseClass, ReportTx, ServiceInput } from "./compute";

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Não foi possível carregar ${what}: ${res.error.message}`);
  return res.data as T;
}

type Raw = {
  id: string; kind: ReportTx["kind"]; status: ReportTx["status"]; description: string; amount: number; competence_date: string; settled_date: string | null; due_date: string | null;
  customer_id: string | null; supplier: string | null;
  expense_category: { name: string; classification: ExpenseClass } | null; revenue_category: { name: string } | null;
  account: { name: string } | null; payment_method: { name: string } | null;
};

export type ReportTxFull = ReportTx & { id: string; description: string; dueDate: string | null; supplier: string | null; accountName: string | null; paymentMethodName: string | null };

/** Lançamentos que pertencem ao mês (por competência) OU que entraram/saíram no mês (por data de pagamento). */
export async function getReportTransactions(month: string): Promise<ReportTxFull[]> {
  const { from, to } = monthRange(month);
  const db = await createClient();
  const res = await db
    .from("transactions")
    .select(
      "id,kind,status,description,amount,competence_date,settled_date,due_date,customer_id,supplier," +
        "expense_category:expense_categories(name,classification),revenue_category:revenue_categories(name)," +
        "account:accounts!transactions_account_id_fkey(name),payment_method:payment_methods(name)",
    )
    .or(`and(competence_date.gte.${from},competence_date.lte.${to}),and(settled_date.gte.${from},settled_date.lte.${to})`)
    .order("competence_date", { ascending: true })
    .limit(20000);
  return (must(res, "os lançamentos") as unknown as Raw[]).map((r) => ({
    id: r.id, kind: r.kind, status: r.status, description: r.description, amount: fromDbAmount(r.amount),
    competenceDate: r.competence_date, settledDate: r.settled_date, dueDate: r.due_date, supplier: r.supplier,
    categoryName: (r.kind === "receita" ? r.revenue_category?.name : r.expense_category?.name) ?? null,
    expenseClass: r.kind === "despesa" ? (r.expense_category?.classification ?? null) : null,
    accountName: r.account?.name ?? null, paymentMethodName: r.payment_method?.name ?? null,
  }));
}

export const toServiceInput = (s: ServiceRow): ServiceInput => ({
  typeName: s.typeName, status: s.status, completedDate: spParts(s.completedAt)?.date ?? null, contractValue: s.contractValue, totalCost: s.totalCost, received: s.received,
});

export async function getAllServices(): Promise<ServiceRow[]> {
  return listServices();
}

export type CompanySettings = {
  companyName: string; legalName: string | null; document: string | null; phone: string | null; whatsapp: string | null; email: string | null; address: string | null;
  monthlyRevenueGoal: number | null; monthlyProfitGoal: number | null;
};

export async function getSettings(): Promise<CompanySettings> {
  const db = await createClient();
  const res = await db.from("company_settings").select("*").maybeSingle();
  if (res.error) throw new Error(`Não foi possível carregar as configurações: ${res.error.message}`);
  const r = res.data;
  return {
    companyName: r?.company_name ?? "Forte Duto", legalName: r?.legal_name ?? null, document: r?.document ?? null, phone: r?.phone ?? null, whatsapp: r?.whatsapp ?? null,
    email: r?.email ?? null, address: r?.address ?? null,
    monthlyRevenueGoal: r?.monthly_revenue_goal == null ? null : fromDbAmount(r.monthly_revenue_goal),
    monthlyProfitGoal: r?.monthly_profit_goal == null ? null : fromDbAmount(r.monthly_profit_goal),
  };
}
