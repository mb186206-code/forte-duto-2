"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";
import { accountSchema, fieldErrors, formToObject, settleSchema, transactionSchema, transferSchema } from "@/lib/validation/financeiro";
import { dbNum } from "./queries";

const refresh = () => {
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  revalidatePath("/fundos");
};

const fail = (message: string): FormState => ({ status: "error", message });

/** Traduz erros do banco para uma frase que a pessoa entende. */
function friendly(error: { message: string; code?: string }): string {
  if (error.code === "23505") return "Já existe um registro com esse nome.";
  if (error.code === "23503") return "Esse registro está sendo usado em outro lugar.";
  return "Não foi possível salvar agora. Tente de novo.";
}

/** Cria ou edita uma entrada (receita) ou despesa. */
export async function saveTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = transactionSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();

  const row = {
    kind: v.kind,
    status: v.done ? ("efetivado" as const) : ("pendente" as const),
    description: v.description,
    amount: dbNum(v.amount),
    competence_date: v.date,
    due_date: v.done ? null : v.date,
    settled_date: v.done ? v.date : null,
    account_id: v.accountId ?? null,
    revenue_category_id: v.kind === "receita" ? (v.categoryId ?? null) : null,
    expense_category_id: v.kind === "despesa" ? (v.categoryId ?? null) : null,
    payment_method_id: v.paymentMethodId ?? null,
    customer_id: v.kind === "receita" ? (v.customerId ?? null) : null,
    supplier: v.kind === "despesa" ? (v.supplier ?? null) : null,
    notes: v.notes ?? null,
  };

  const res = v.id ? await db.from("transactions").update(row).eq("id", v.id) : await db.from("transactions").insert(row);
  if (res.error) return fail(friendly(res.error));
  refresh();
  return { status: "success", message: v.id ? "Alterações salvas." : v.kind === "receita" ? "Entrada anotada." : "Despesa anotada." };
}

/** Marca uma pendência como recebida/paga. */
export async function settleTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = settleSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const db = await createClient();
  const res = await db
    .from("transactions")
    .update({ status: "efetivado", settled_date: parsed.data.date, account_id: parsed.data.accountId })
    .eq("id", parsed.data.id)
    .eq("status", "pendente");
  if (res.error) return fail(friendly(res.error));
  refresh();
  return { status: "success", message: "Confirmado." };
}

/** Cancela (some dos cálculos, fica no histórico). */
export async function cancelTransaction(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("transactions").update({ status: "cancelado" }).eq("id", id);
  if (res.error) return fail(friendly(res.error));
  refresh();
  return { status: "success", message: "Lançamento cancelado." };
}

export async function deleteTransaction(id: string): Promise<FormState> {
  const db = await createClient();
  const res = await db.from("transactions").delete().eq("id", id);
  if (res.error) return fail(friendly(res.error));
  refresh();
  return { status: "success", message: "Lançamento apagado." };
}

export async function saveAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = accountSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();
  const row = { name: v.name, type: v.type, opening_balance: dbNum(v.openingBalance) };
  const res = v.id ? await db.from("accounts").update({ name: v.name, type: v.type }).eq("id", v.id) : await db.from("accounts").insert(row);
  if (res.error) return res.error.code === "23505" ? { status: "error", fieldErrors: { name: "Já existe uma conta com esse nome." } } : fail(friendly(res.error));
  refresh();
  return { status: "success", message: v.id ? "Conta atualizada." : "Conta criada." };
}

/** Passa dinheiro de uma conta para outra. Não é entrada nem despesa. */
export async function transferBetweenAccounts(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = transferSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();
  const res = await db.from("transactions").insert({
    kind: "transferencia",
    status: "efetivado",
    description: "Transferência entre contas",
    amount: dbNum(v.amount),
    competence_date: v.date,
    settled_date: v.date,
    account_id: v.fromId,
    to_account_id: v.toId,
    notes: v.notes ?? null,
  });
  if (res.error) return fail(friendly(res.error));
  refresh();
  return { status: "success", message: "Transferência feita." };
}
