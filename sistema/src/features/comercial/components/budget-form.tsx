"use client";

import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toInputValue } from "@/lib/money";
import { saveBudget } from "../actions";
import type { BudgetRow, CommercialLookups } from "../types";

export function BudgetForm({ budget, lookups, customerId, today, onDone }: { budget?: BudgetRow; lookups: CommercialLookups; customerId?: string; today: string; onDone: () => void }) {
  return (
    <ActionForm action={saveBudget} onDone={onDone} submitLabel={budget ? "Salvar" : "Criar e adicionar itens"} submitVariant="highlight">
      {({ fe }) => (
        <>
          {budget && <input type="hidden" name="id" value={budget.id} />}
          <Field id="b-customer" label="Cliente" error={fe.customerId}>
            <Select id="b-customer" name="customerId" defaultValue={budget?.customerId ?? customerId ?? ""} aria-invalid={!!fe.customerId || undefined}>
              <option value="">Escolha…</option>
              {lookups.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {lookups.customers.length === 0 && <p className="text-sm text-muted-foreground">Cadastre o cliente primeiro, na aba Clientes.</p>}
          </Field>
          <Field id="b-type" label="Que serviço é?" optional error={fe.serviceTypeId}>
            <Select id="b-type" name="serviceTypeId" defaultValue={budget?.serviceTypeId ?? ""}>
              <option value="">Não definido</option>
              {lookups.serviceTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="b-desc" label="Descrição do trabalho" optional error={fe.description}>
            <Textarea id="b-desc" name="description" rows={3} defaultValue={budget?.description ?? ""} maxLength={2000} placeholder="Ex.: Desentupimento da rede de esgoto com máquina" />
          </Field>
          <Field id="b-address" label="Endereço" optional error={fe.address}>
            <Input id="b-address" name="address" defaultValue={budget?.address ?? ""} maxLength={300} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="b-issue" label="Data do orçamento" error={fe.issueDate}>
              <Input id="b-issue" name="issueDate" type="date" defaultValue={budget?.issueDate ?? today} />
            </Field>
            <Field id="b-valid" label="Vale até" optional error={fe.validUntil}>
              <Input id="b-valid" name="validUntil" type="date" defaultValue={budget?.validUntil ?? ""} />
            </Field>
          </div>
          <Field id="b-discount" label="Desconto" optional error={fe.discount}>
            <MoneyInput id="b-discount" name="discount" defaultValue={budget && budget.discount > 0 ? toInputValue(budget.discount) : ""} />
          </Field>
          <Field id="b-notes" label="Observação" optional error={fe.notes}>
            <Textarea id="b-notes" name="notes" rows={2} defaultValue={budget?.notes ?? ""} maxLength={2000} placeholder="Ex.: Pagamento 50% na entrada" />
          </Field>
        </>
      )}
    </ActionForm>
  );
}
