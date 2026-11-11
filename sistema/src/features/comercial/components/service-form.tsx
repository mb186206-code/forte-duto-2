"use client";

import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { spParts } from "@/lib/dates";
import { toInputValue } from "@/lib/money";
import { saveService } from "../actions";
import { SERVICE_STATUS_LABEL, type CommercialLookups, type ServiceRow, type ServiceStatus } from "../types";

export function ServiceForm({ service, lookups, customerId, onDone }: { service?: ServiceRow; lookups: CommercialLookups; customerId?: string; onDone: () => void }) {
  const when = spParts(service?.scheduledAt);
  return (
    <ActionForm action={saveService} onDone={onDone} submitLabel={service ? "Salvar" : "Anotar serviço"} submitVariant="highlight">
      {({ fe }) => (
        <>
          {service && <input type="hidden" name="id" value={service.id} />}
          <Field id="s-customer" label="Cliente" error={fe.customerId}>
            <Select id="s-customer" name="customerId" defaultValue={service?.customerId ?? customerId ?? ""} aria-invalid={!!fe.customerId || undefined}>
              <option value="">Escolha…</option>
              {lookups.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {lookups.customers.length === 0 && <p className="text-sm text-muted-foreground">Cadastre o cliente primeiro, na aba Clientes.</p>}
          </Field>
          <Field id="s-type" label="Que serviço é?" optional error={fe.serviceTypeId}>
            <Select id="s-type" name="serviceTypeId" defaultValue={service?.serviceTypeId ?? ""}>
              <option value="">Não definido</option>
              {lookups.serviceTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="s-desc" label="Detalhes" optional error={fe.description}>
            <Textarea id="s-desc" name="description" rows={2} defaultValue={service?.description ?? ""} maxLength={2000} placeholder="Ex.: Pia da cozinha entupida, água não desce" />
          </Field>
          <Field id="s-address" label="Endereço do serviço" optional hint="Se deixar em branco, usa o endereço do cliente." error={fe.address}>
            <Input id="s-address" name="address" defaultValue={service?.address ?? ""} maxLength={300} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="s-date" label="Dia" optional error={fe.scheduledDate}>
              <Input id="s-date" name="scheduledDate" type="date" defaultValue={when?.date ?? ""} />
            </Field>
            <Field id="s-time" label="Hora" optional error={fe.scheduledTime}>
              <Input id="s-time" name="scheduledTime" type="time" defaultValue={when?.time ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="s-value" label="Valor combinado" optional error={fe.contractValue}>
              <MoneyInput id="s-value" name="contractValue" defaultValue={service?.contractValue != null ? toInputValue(service.contractValue) : ""} />
            </Field>
            <Field id="s-resp" label="Quem vai fazer?" optional error={fe.responsibleName}>
              <Input id="s-resp" name="responsibleName" defaultValue={service?.responsibleName ?? ""} maxLength={120} placeholder="Ex.: Pedro" />
            </Field>
          </div>
          {service && (
            <Field id="s-status" label="Situação" error={fe.status}>
              <Select id="s-status" name="status" defaultValue={service.status}>
                {(Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {SERVICE_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field id="s-notes" label="Observação" optional error={fe.notes}>
            <Textarea id="s-notes" name="notes" rows={2} defaultValue={service?.notes ?? ""} maxLength={2000} />
          </Field>
        </>
      )}
    </ActionForm>
  );
}
