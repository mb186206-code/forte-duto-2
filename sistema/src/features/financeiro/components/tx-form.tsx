"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/forms/money-input";
import { ActionForm } from "@/components/forms/action-form";
import { saveTransaction } from "../actions";
import type { Lookups, TxRow } from "../types";

/** Formulário de entrada ou despesa. Poucos campos, em linguagem do dia a dia. */
export function TxForm({
  kind,
  tx,
  lookups,
  today,
  onDone,
}: {
  kind: "receita" | "despesa";
  tx?: TxRow;
  lookups: Lookups;
  today: string;
  onDone: () => void;
}) {
  const isIn = kind === "receita";
  const [done, setDone] = useState(tx ? tx.status === "efetivado" : true);
  const categories = isIn ? lookups.revenueCategories : lookups.expenseCategories;
  const amountDefault = tx ? (tx.amount / 100).toFixed(2).replace(".", ",") : "";

  return (
    <ActionForm action={saveTransaction} onDone={onDone} submitLabel={tx ? "Salvar alterações" : isIn ? "Anotar entrada" : "Anotar despesa"} submitVariant="highlight">
      {({ fe }) => (
        <>
          {tx && <input type="hidden" name="id" value={tx.id} />}
          <input type="hidden" name="kind" value={kind} />

          <Field id="amount" label={isIn ? "Quanto recebeu?" : "Quanto pagou?"} error={fe.amount}>
            <MoneyInput id="amount" name="amount" autoFocus defaultValue={amountDefault} aria-invalid={!!fe.amount || undefined} />
          </Field>

          <Field id="description" label={isIn ? "De quê? (serviço ou cliente)" : "O que foi?"} error={fe.description}>
            <Input
              id="description"
              name="description"
              defaultValue={tx?.description}
              maxLength={200}
              placeholder={isIn ? "Ex.: Desentupimento da Maria" : "Ex.: Compra de material"}
              aria-invalid={!!fe.description || undefined}
            />
          </Field>

          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-secondary/60 px-4 py-3">
            <input
              type="checkbox"
              name="done"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
              className="size-5 accent-[var(--success)]"
            />
            <span className="font-medium">{isIn ? "Já recebi esse dinheiro" : "Já paguei essa conta"}</span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="date" label={done ? (isIn ? "Dia que recebeu" : "Dia que pagou") : "Vence em"} error={fe.date}>
              <Input id="date" name="date" type="date" required defaultValue={tx ? tx.date : today} aria-invalid={!!fe.date || undefined} />
            </Field>
            <Field id="accountId" label={isIn ? "Entrou em qual conta?" : "Saiu de qual conta?"} optional={!done} error={fe.accountId}>
              <Select id="accountId" name="accountId" defaultValue={tx?.accountId ?? (lookups.accounts.length === 1 ? lookups.accounts[0].id : "")} aria-invalid={!!fe.accountId || undefined}>
                <option value="">Escolha…</option>
                {lookups.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="categoryId" label="Tipo" optional error={fe.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={tx?.categoryId ?? ""}>
                <option value="">Sem tipo</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="paymentMethodId" label="Como foi pago?" optional error={fe.paymentMethodId}>
              <Select id="paymentMethodId" name="paymentMethodId" defaultValue={tx?.paymentMethodId ?? ""}>
                <option value="">Não informar</option>
                {lookups.paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {isIn ? (
            lookups.customers.length > 0 && (
              <Field id="customerId" label="Cliente" optional error={fe.customerId}>
                <Select id="customerId" name="customerId" defaultValue={tx?.customerId ?? ""}>
                  <option value="">Sem cliente</option>
                  {lookups.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )
          ) : (
            <Field id="supplier" label="Pago a quem?" optional error={fe.supplier}>
              <Input id="supplier" name="supplier" defaultValue={tx?.supplier ?? ""} maxLength={120} placeholder="Ex.: Loja de materiais" />
            </Field>
          )}

          <Field id="notes" label="Observação" optional error={fe.notes}>
            <Textarea id="notes" name="notes" defaultValue={tx?.notes ?? ""} rows={2} maxLength={2000} />
          </Field>
        </>
      )}
    </ActionForm>
  );
}
