"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";
import { fieldErrors, formToObject, fundMovementSchema, fundSchema } from "@/lib/validation/financeiro";
import { dbNum } from "@/features/financeiro/queries";

const refresh = () => {
  revalidatePath("/fundos");
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
};

export async function saveFund(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = fundSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();
  const res = await db.from("funds").insert({
    name: v.name,
    description: v.description ?? null,
    target_amount: v.target === null ? null : dbNum(v.target),
  });
  if (res.error) {
    return res.error.code === "23505"
      ? { status: "error", fieldErrors: { name: "Já existe um fundo com esse nome." } }
      : { status: "error", message: "Não foi possível criar o fundo agora. Tente de novo." };
  }
  refresh();
  return { status: "success", message: "Fundo criado." };
}

/** Guardar (depósito) ou tirar (retirada) dinheiro de um fundo. Não é despesa. */
export async function moveFund(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = fundMovementSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = await createClient();
  const res = await db.from("fund_movements").insert({
    fund_id: v.fundId,
    kind: v.kind,
    amount: dbNum(v.amount),
    movement_date: v.date,
    notes: v.notes ?? null,
  });
  if (res.error) {
    return res.error.message.includes("Retirada maior")
      ? { status: "error", fieldErrors: { amount: "Esse valor é maior do que tem guardado no fundo." } }
      : { status: "error", message: "Não foi possível salvar agora. Tente de novo." };
  }
  refresh();
  return { status: "success", message: v.kind === "deposito" ? "Dinheiro guardado no fundo." : "Dinheiro retirado do fundo." };
}

export async function archiveFund(id: string): Promise<FormState> {
  const db = await createClient();
  const { data } = await db.from("fund_balances").select("balance").eq("id", id).single();
  if (data && Number(data.balance) > 0) {
    return { status: "error", message: "Retire o dinheiro do fundo antes de arquivar." };
  }
  const res = await db.from("funds").update({ active: false }).eq("id", id);
  if (res.error) return { status: "error", message: "Não foi possível arquivar agora." };
  refresh();
  return { status: "success", message: "Fundo arquivado." };
}
