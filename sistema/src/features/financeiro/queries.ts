import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fromDbAmount, sumCents, toDbAmount } from "@/lib/money";
import { monthRange } from "@/lib/dates";
import type { FundMovementRow, FundRow, Lookups, Option, Position, TxRow } from "./types";

/** Valor em centavos → número para gravar no banco sem erro de ponto flutuante ("1234.56"). */
export const dbNum = (cents: number) => Number(toDbAmount(cents));

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Não foi possível carregar ${what}: ${res.error.message}`);
  return res.data as T;
}

const nameOptions = (rows: { id: string; name: string }[] | null): Option[] => (rows ?? []).map((r) => ({ id: r.id, name: r.name }));

export async function getLookups(): Promise<Lookups> {
  const db = await createClient();
  const [acc, rev, exp, pm, cust] = await Promise.all([
    db.from("account_balances").select("id,name,type,balance,active").eq("active", true).order("name"),
    db.from("revenue_categories").select("id,name").eq("active", true).order("sort_order"),
    db.from("expense_categories").select("id,name").eq("active", true).order("sort_order"),
    db.from("payment_methods").select("id,name").eq("active", true).order("sort_order"),
    db.from("customers").select("id,name").order("name").limit(500),
  ]);
  return {
    accounts: must(acc, "as contas").map((a) => ({ id: a.id!, name: a.name!, type: a.type!, balance: fromDbAmount(a.balance), active: a.active! })),
    revenueCategories: nameOptions(must(rev, "as categorias")),
    expenseCategories: nameOptions(must(exp, "as categorias")),
    paymentMethods: nameOptions(must(pm, "as formas de pagamento")),
    customers: nameOptions(must(cust, "os clientes")),
  };
}

export async function getPosition(): Promise<Position> {
  const db = await createClient();
  const res = await db.from("financial_position").select("*").single();
  if (res.error || !res.data) throw new Error(`Não foi possível carregar o saldo: ${res.error?.message ?? "sem dados"}`);
  const r = res.data;
  return {
    available: fromDbAmount(r.available_balance),
    reserved: fromDbAmount(r.reserved_balance),
    free: fromDbAmount(r.free_balance),
    receivable: fromDbAmount(r.receivable),
    payable: fromDbAmount(r.payable),
  };
}

const TX_SELECT =
  "id,kind,status,description,amount,competence_date,due_date,settled_date,account_id,to_account_id,revenue_category_id,expense_category_id,payment_method_id,customer_id,supplier,notes,created_by," +
  "account:accounts!transactions_account_id_fkey(name),to_account:accounts!transactions_to_account_id_fkey(name)," +
  "revenue_category:revenue_categories(name),expense_category:expense_categories(name),payment_method:payment_methods(name)";

type RawTx = {
  id: string; kind: TxRow["kind"]; status: TxRow["status"]; description: string; amount: number;
  competence_date: string; due_date: string | null; settled_date: string | null;
  account_id: string | null; to_account_id: string | null; revenue_category_id: string | null; expense_category_id: string | null;
  payment_method_id: string | null; customer_id: string | null; supplier: string | null; notes: string | null; created_by: string;
  account: { name: string } | null; to_account: { name: string } | null;
  revenue_category: { name: string } | null; expense_category: { name: string } | null; payment_method: { name: string } | null;
};

export function toTxRow(r: RawTx): TxRow {
  const category = r.kind === "receita" ? r.revenue_category : r.expense_category;
  return {
    id: r.id, kind: r.kind, status: r.status, description: r.description, amount: fromDbAmount(r.amount),
    competenceDate: r.competence_date, dueDate: r.due_date, settledDate: r.settled_date,
    date: r.settled_date ?? r.due_date ?? r.competence_date,
    accountId: r.account_id, accountName: r.account?.name ?? null,
    toAccountId: r.to_account_id, toAccountName: r.to_account?.name ?? null,
    categoryId: (r.kind === "receita" ? r.revenue_category_id : r.expense_category_id) ?? null,
    categoryName: category?.name ?? null,
    paymentMethodId: r.payment_method_id, paymentMethodName: r.payment_method?.name ?? null,
    customerId: r.customer_id, supplier: r.supplier, notes: r.notes, createdBy: r.created_by,
  };
}

/** Lançamentos de um mês: pelo dia em que foi pago/recebido, ou pelo dia do fato se ainda está pendente. */
export async function listMonthTransactions(month: string): Promise<TxRow[]> {
  const { from, to } = monthRange(month);
  const db = await createClient();
  const res = await db
    .from("transactions")
    .select(TX_SELECT)
    .or(`and(settled_date.gte.${from},settled_date.lte.${to}),and(settled_date.is.null,competence_date.gte.${from},competence_date.lte.${to})`)
    .order("settled_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1000);
  return (must(res, "os lançamentos") as unknown as RawTx[]).map(toTxRow);
}

/** Pendências de todos os meses (a receber / a pagar), mais antigas primeiro. */
export async function listPending(): Promise<TxRow[]> {
  const db = await createClient();
  const res = await db.from("transactions").select(TX_SELECT).eq("status", "pendente").order("due_date", { ascending: true, nullsFirst: false }).limit(300);
  return (must(res, "as pendências") as unknown as RawTx[]).map(toTxRow);
}

export async function listRecent(limit = 5): Promise<TxRow[]> {
  const db = await createClient();
  const res = await db
    .from("transactions")
    .select(TX_SELECT)
    .neq("status", "cancelado")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (must(res, "os últimos lançamentos") as unknown as RawTx[]).map(toTxRow);
}

export type MonthSummary = { in: number; out: number; result: number; toReceive: number; toPay: number };

/** Entrou/saiu = só o que foi efetivado. Transferência e cancelado nunca entram. */
export function summarize(rows: TxRow[]): MonthSummary {
  const sum = (kind: TxRow["kind"], status: TxRow["status"]) => sumCents(rows.filter((r) => r.kind === kind && r.status === status).map((r) => r.amount));
  const inn = sum("receita", "efetivado");
  const out = sum("despesa", "efetivado");
  return { in: inn, out, result: inn - out, toReceive: sum("receita", "pendente"), toPay: sum("despesa", "pendente") };
}

export async function getFunds(): Promise<FundRow[]> {
  const db = await createClient();
  const rows = must(await db.from("fund_balances").select("*").eq("active", true).order("name"), "os fundos");
  return rows.map((f) => ({
    id: f.id!, name: f.name!, description: f.description, targetAmount: f.target_amount === null ? null : fromDbAmount(f.target_amount),
    targetDate: f.target_date, balance: fromDbAmount(f.balance), targetPercent: f.target_percent === null ? null : Number(f.target_percent), active: f.active!,
  }));
}

export async function getFundMovements(limitPerFund = 5): Promise<Record<string, FundMovementRow[]>> {
  const db = await createClient();
  const rows = must(await db.from("fund_movements").select("id,fund_id,kind,amount,movement_date,notes,created_by").order("movement_date", { ascending: false }).order("created_at", { ascending: false }).limit(300), "o histórico dos fundos");
  const out: Record<string, FundMovementRow[]> = {};
  for (const m of rows) {
    const list = (out[m.fund_id] ??= []);
    if (list.length < limitPerFund) list.push({ id: m.id, fundId: m.fund_id, kind: m.kind, amount: fromDbAmount(m.amount), date: m.movement_date, notes: m.notes, createdBy: m.created_by });
  }
  return out;
}

export type MonthPoint = { month: string; in: number; out: number };

/** Entradas e saídas efetivadas dos últimos `count` meses (para o gráfico do início). */
export async function getMonthlySeries(count: number, endMonth: string): Promise<MonthPoint[]> {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) months.push(shiftMonthLocal(endMonth, -i));
  const from = monthRange(months[0]).from;
  const to = monthRange(endMonth).to;
  const db = await createClient();
  const res = await db
    .from("transactions")
    .select("kind,amount,settled_date")
    .eq("status", "efetivado")
    .in("kind", ["receita", "despesa"])
    .gte("settled_date", from)
    .lte("settled_date", to)
    .limit(20000);
  const rows = must(res, "o gráfico");
  const byMonth = new Map(months.map((m) => [m, { month: m, in: 0, out: 0 }]));
  for (const r of rows) {
    const p = byMonth.get(String(r.settled_date).slice(0, 7));
    if (!p) continue;
    const cents = fromDbAmount(r.amount);
    if (r.kind === "receita") p.in += cents;
    else p.out += cents;
  }
  return months.map((m) => byMonth.get(m)!);
}

function shiftMonthLocal(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
