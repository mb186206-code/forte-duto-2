"use client";

import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toInputValue } from "@/lib/money";
import type { CompanySettings } from "@/features/relatorios/queries";
import { saveCompany } from "../actions";

export function CompanyForm({ settings }: { settings: CompanySettings }) {
  return (
    <ActionForm action={saveCompany} onDone={() => {}} submitLabel="Salvar dados da empresa" submitVariant="highlight">
      {({ fe }) => (
        <>
          <Field id="co-name" label="Nome da empresa" error={fe.companyName}>
            <Input id="co-name" name="companyName" defaultValue={settings.companyName} maxLength={120} aria-invalid={!!fe.companyName || undefined} />
          </Field>
          <Field id="co-legal" label="Razão social" optional error={fe.legalName}>
            <Input id="co-legal" name="legalName" defaultValue={settings.legalName ?? ""} maxLength={160} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="co-doc" label="CNPJ ou CPF" optional error={fe.document}>
              <Input id="co-doc" name="document" inputMode="numeric" defaultValue={settings.document ?? ""} maxLength={20} />
            </Field>
            <Field id="co-whats" label="WhatsApp" optional error={fe.whatsapp}>
              <Input id="co-whats" name="whatsapp" type="tel" defaultValue={settings.whatsapp ?? ""} maxLength={30} />
            </Field>
            <Field id="co-phone" label="Telefone" optional error={fe.phone}>
              <Input id="co-phone" name="phone" type="tel" defaultValue={settings.phone ?? ""} maxLength={30} />
            </Field>
            <Field id="co-email" label="E-mail" optional error={fe.email}>
              <Input id="co-email" name="email" type="email" defaultValue={settings.email ?? ""} maxLength={160} />
            </Field>
          </div>
          <Field id="co-address" label="Endereço" optional error={fe.address}>
            <Input id="co-address" name="address" defaultValue={settings.address ?? ""} maxLength={300} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="co-goal-rev" label="Meta de faturamento do mês" optional error={fe.monthlyRevenueGoal}>
              <MoneyInput id="co-goal-rev" name="monthlyRevenueGoal" defaultValue={settings.monthlyRevenueGoal != null ? toInputValue(settings.monthlyRevenueGoal) : ""} />
            </Field>
            <Field id="co-goal-profit" label="Meta de lucro do mês" optional error={fe.monthlyProfitGoal}>
              <MoneyInput id="co-goal-profit" name="monthlyProfitGoal" defaultValue={settings.monthlyProfitGoal != null ? toInputValue(settings.monthlyProfitGoal) : ""} />
            </Field>
          </div>
        </>
      )}
    </ActionForm>
  );
}
