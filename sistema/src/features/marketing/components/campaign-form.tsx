"use client";

import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toInputValue } from "@/lib/money";
import { PLATFORM_LABEL } from "@/lib/utm";
import type { Option } from "@/features/financeiro/types";
import { saveCampaign } from "../actions";
import { CAMPAIGN_STATUS_LABEL, type CampaignRow, type CampaignStatus } from "../types";

export function CampaignForm({ campaign, serviceTypes, onDone }: { campaign?: CampaignRow; serviceTypes: Option[]; onDone: () => void }) {
  return (
    <ActionForm action={saveCampaign} onDone={onDone} submitLabel={campaign ? "Salvar" : "Criar campanha"} submitVariant="highlight">
      {({ fe }) => (
        <>
          {campaign && <input type="hidden" name="id" value={campaign.id} />}
          <Field id="m-name" label="Nome da campanha" error={fe.name}>
            <Input id="m-name" name="name" autoFocus defaultValue={campaign?.name} maxLength={120} placeholder="Ex.: Desentupimento — Instagram" aria-invalid={!!fe.name || undefined} />
          </Field>
          <Field id="m-platform" label="Onde o anúncio roda?" error={fe.platform}>
            <Select id="m-platform" name="platform" defaultValue={campaign?.platform ?? ""} aria-invalid={!!fe.platform || undefined}>
              <option value="">Escolha…</option>
              {Object.entries(PLATFORM_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="m-service" label="Serviço divulgado" optional error={fe.serviceTypeId}>
              <Select id="m-service" name="serviceTypeId" defaultValue={campaign?.serviceTypeId ?? ""}>
                <option value="">Vários</option>
                {serviceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="m-status" label="Situação" error={fe.status}>
              <Select id="m-status" name="status" defaultValue={campaign?.status ?? "ativa"}>
                {(Object.keys(CAMPAIGN_STATUS_LABEL) as CampaignStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {CAMPAIGN_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field id="m-start" label="Começa em" optional error={fe.startDate}>
              <Input id="m-start" name="startDate" type="date" defaultValue={campaign?.startDate ?? ""} />
            </Field>
            <Field id="m-end" label="Termina em" optional error={fe.endDate}>
              <Input id="m-end" name="endDate" type="date" defaultValue={campaign?.endDate ?? ""} />
            </Field>
          </div>
          <Field id="m-budget" label="Quanto pretende gastar" optional error={fe.plannedBudget}>
            <MoneyInput id="m-budget" name="plannedBudget" defaultValue={campaign?.plannedBudget != null ? toInputValue(campaign.plannedBudget) : ""} />
          </Field>
          <Field id="m-utm" label="Código do link" optional hint="Liga quem entra pelo link a esta campanha. Se deixar em branco, usamos o nome." error={fe.utmCampaign}>
            <Input id="m-utm" name="utmCampaign" defaultValue={campaign?.utmCampaign ?? ""} maxLength={80} placeholder="ex.: desentupimento-instagram" />
          </Field>
          <Field id="m-notes" label="Observação" optional error={fe.notes}>
            <Textarea id="m-notes" name="notes" rows={2} defaultValue={campaign?.notes ?? ""} maxLength={2000} />
          </Field>
        </>
      )}
    </ActionForm>
  );
}
