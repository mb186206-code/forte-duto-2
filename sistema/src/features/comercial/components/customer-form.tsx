"use client";

import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toInputValue } from "@/lib/money";
import { saveCustomer } from "../actions";
import { CUSTOMER_STATUS_LABEL, type CommercialLookups, type CustomerRow, type CustomerStatus } from "../types";

export function CustomerForm({ customer, lookups, onDone }: { customer?: CustomerRow; lookups: CommercialLookups; onDone: () => void }) {
  return (
    <ActionForm action={saveCustomer} onDone={onDone} submitLabel={customer ? "Salvar" : "Cadastrar cliente"} submitVariant="highlight">
      {({ fe }) => (
        <>
          {customer && <input type="hidden" name="id" value={customer.id} />}
          <Field id="c-name" label="Nome" error={fe.name}>
            <Input id="c-name" name="name" autoFocus defaultValue={customer?.name} maxLength={120} placeholder="Ex.: Maria Souza" aria-invalid={!!fe.name || undefined} />
          </Field>
          <Field id="c-whatsapp" label="WhatsApp ou telefone" optional error={fe.whatsapp ?? fe.phone}>
            <Input
              id="c-whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={customer?.whatsapp ?? customer?.phone ?? ""}
              maxLength={30}
              placeholder="(11) 91234-5678"
              aria-invalid={!!(fe.whatsapp ?? fe.phone) || undefined}
            />
          </Field>
          <Field id="c-address" label="Endereço" optional error={fe.address}>
            <Input id="c-address" name="address" defaultValue={customer?.address ?? ""} maxLength={300} placeholder="Rua, número, bairro" />
          </Field>
          <Field id="c-service" label="O que ele precisa?" optional error={fe.requestedService}>
            <Input id="c-service" name="requestedService" defaultValue={customer?.requestedService ?? ""} maxLength={200} placeholder="Ex.: Pia da cozinha entupida" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="c-value" label="Valor estimado" optional error={fe.estimatedValue}>
              <MoneyInput id="c-value" name="estimatedValue" defaultValue={customer?.estimatedValue != null ? toInputValue(customer.estimatedValue) : ""} />
            </Field>
            <Field id="c-source" label="Como conheceu a empresa?" optional error={fe.sourceId}>
              <Select id="c-source" name="sourceId" defaultValue={customer?.sourceId ?? ""}>
                <option value="">Não sei</option>
                {lookups.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field id="c-status" label="Situação" error={fe.status}>
            <Select id="c-status" name="status" defaultValue={customer?.status ?? "novo_contato"}>
              {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[]).map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="c-notes" label="Observação" optional error={fe.notes}>
            <Textarea id="c-notes" name="notes" rows={3} defaultValue={customer?.notes ?? ""} maxLength={2000} />
          </Field>
        </>
      )}
    </ActionForm>
  );
}
