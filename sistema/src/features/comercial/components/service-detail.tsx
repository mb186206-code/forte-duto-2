"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { RunButton } from "@/components/forms/run-button";
import { Money } from "@/components/shared/money";
import { formatDateBR } from "@/lib/dates";
import type { Lookups } from "@/features/financeiro/types";
import { addCostItem, addServicePayment, deleteService, removeCostItem, setServiceStatus } from "../actions";
import { ServiceForm } from "./service-form";
import { PhotoSection } from "./photo-section";
import { ITEM_KIND_LABEL, SERVICE_STATUS_LABEL, type AttachmentRow, type CommercialLookups, type ItemKind, type LineItem, type PaymentRow, type ServiceRow, type ServiceStatus } from "../types";

export function ServiceDetail({
  service, costs, payments, attachments, lookups, money, today,
}: {
  service: ServiceRow; costs: LineItem[]; payments: PaymentRow[]; attachments: AttachmentRow[]; lookups: CommercialLookups; money: Lookups; today: string;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<"editar" | "pagamento" | "custo" | null>(null);
  const [done, setDone] = useState(true);
  const refresh = () => router.refresh();
  const close = () => {
    setSheet(null);
    router.refresh();
  };

  const contract = service.contractValue ?? 0;
  const left = Math.max(contract - service.received - service.toReceive, 0);
  const expected = contract - service.totalCost;
  const real = service.received - service.totalCost;
  const nextStatuses = (Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[]).filter((s) => s !== service.status);

  return (
    <div className="grid gap-4">
      <Card className="grid gap-3 p-4">
        <h2 className="font-semibold">Situação: <Badge className="ml-1">{SERVICE_STATUS_LABEL[service.status]}</Badge></h2>
        <div className="grid grid-cols-2 gap-2">
          {nextStatuses.map((s) => (
            <RunButton key={s} size="default" variant={s === "concluido" ? "highlight" : "outline"} run={() => setServiceStatus(service.id, s)} onDone={refresh}>
              {s === "concluido" ? "Concluir" : SERVICE_STATUS_LABEL[s]}
            </RunButton>
          ))}
        </div>
        {service.status === "concluido" && service.received + service.toReceive === 0 && contract > 0 && (
          <p className="rounded-lg bg-warning-soft p-3 text-sm">Serviço concluído, mas nenhum pagamento foi anotado ainda. Concluir não registra dinheiro sozinho.</p>
        )}
      </Card>

      <Card className="grid gap-1 p-4">
        <h2 className="mb-1 font-semibold">Dinheiro deste serviço</h2>
        <Line label="Valor combinado" value={service.contractValue != null ? <Money cents={contract} /> : "Não definido"} />
        <Line label="Já recebeu" value={<Money cents={service.received} tone="in" />} />
        {service.toReceive > 0 && <Line label="Anotado como a receber" value={<Money cents={service.toReceive} />} />}
        {service.contractValue != null && <Line label="Ainda falta cobrar" value={<Money cents={left} />} />}
        <Line label="Custos (material e mão de obra)" value={<Money cents={service.totalCost} tone={service.totalCost > 0 ? "out" : "neutral"} />} />
        {service.contractValue != null && <Line label="Sobra se receber tudo" value={<Money cents={expected} tone="auto" />} bold />}
        <Line label="Sobrou até agora" value={<Money cents={real} tone="auto" />} bold />
        <Button size="lg" variant="highlight" className="mt-3" onClick={() => setSheet("pagamento")}>
          <BanknoteArrowDown /> Receber pagamento
        </Button>
        {payments.length > 0 && (
          <ul className="mt-3 divide-y border-t">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {formatDateBR(p.date)} · {p.status === "pendente" ? "A receber" : `Recebido${p.accountName ? ` em ${p.accountName}` : ""}`}
                </span>
                <Money cents={p.amount} tone={p.status === "efetivado" ? "in" : "neutral"} className="font-semibold whitespace-nowrap" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Custos</h2>
          <Button size="sm" variant="outline" onClick={() => setSheet("custo")}>
            <Plus /> Anotar custo
          </Button>
        </div>
        {costs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum custo anotado. Anote o material e a mão de obra para saber o lucro.</p>
        ) : (
          <ul className="divide-y">
            {costs.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {ITEM_KIND_LABEL[c.kind]} · {c.quantity.toLocaleString("pt-BR")} × <Money cents={c.unit} />
                  </p>
                </div>
                <Money cents={c.total} className="text-sm font-semibold" />
                <RunButton size="icon-sm" variant="ghost" run={() => removeCostItem(c.id)} onDone={refresh}>
                  <X />
                  <span className="sr-only">Remover custo</span>
                </RunButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Fotos</h2>
        <PhotoSection serviceId={service.id} attachments={attachments} />
      </Card>

      <div className="grid gap-2">
        <Button variant="outline" size="lg" onClick={() => setSheet("editar")}>
          <Pencil /> Editar serviço
        </Button>
        <RunButton variant="ghost" className="text-destructive hover:text-destructive" confirm="Apagar este serviço? Isso não pode ser desfeito." run={() => deleteService(service.id)} onDone={() => router.replace("/servicos")}>
          <Trash2 /> Apagar serviço
        </RunButton>
      </div>

      <BottomSheet open={sheet === "editar"} onOpenChange={(o) => !o && close()} title="Editar serviço">
        {sheet === "editar" && <ServiceForm service={service} lookups={lookups} onDone={close} />}
      </BottomSheet>

      <BottomSheet open={sheet === "pagamento"} onOpenChange={(o) => !o && close()} title="Receber pagamento" description="Vira uma entrada no financeiro.">
        {sheet === "pagamento" && (
          <ActionForm action={addServicePayment} onDone={close} submitLabel="Anotar pagamento" submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="serviceId" value={service.id} />
                <Field id="p-amount" label="Quanto?" error={fe.amount}>
                  <MoneyInput id="p-amount" name="amount" autoFocus defaultValue={left > 0 ? (left / 100).toFixed(2).replace(".", ",") : ""} aria-invalid={!!fe.amount || undefined} />
                </Field>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-secondary/60 px-4 py-3">
                  <input type="checkbox" name="done" checked={done} onChange={(e) => setDone(e.target.checked)} className="size-5 accent-[var(--success)]" />
                  <span className="font-medium">Já recebi esse dinheiro</span>
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="p-date" label={done ? "Dia que recebeu" : "Vai receber em"} error={fe.date}>
                    <Input id="p-date" name="date" type="date" defaultValue={today} />
                  </Field>
                  <Field id="p-account" label="Entrou em qual conta?" optional={!done} error={fe.accountId}>
                    <Select id="p-account" name="accountId" defaultValue={money.accounts.length === 1 ? money.accounts[0].id : ""}>
                      <option value="">Escolha…</option>
                      {money.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field id="p-method" label="Como foi pago?" optional error={fe.paymentMethodId}>
                  <Select id="p-method" name="paymentMethodId" defaultValue="">
                    <option value="">Não informar</option>
                    {money.paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "custo"} onOpenChange={(o) => !o && close()} title="Anotar custo" description="Material comprado ou mão de obra paga neste serviço.">
        {sheet === "custo" && (
          <ActionForm action={addCostItem} onDone={close} submitLabel="Anotar custo" submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="serviceId" value={service.id} />
                <Field id="k-desc" label="O que foi?" error={fe.description}>
                  <Input id="k-desc" name="description" autoFocus maxLength={200} placeholder="Ex.: Cano de 50mm" aria-invalid={!!fe.description || undefined} />
                </Field>
                <Field id="k-kind" label="Tipo" error={fe.kind}>
                  <Select id="k-kind" name="kind" defaultValue="material">
                    {(Object.keys(ITEM_KIND_LABEL) as ItemKind[]).map((k) => (
                      <option key={k} value={k}>
                        {ITEM_KIND_LABEL[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="k-qty" label="Quantidade" error={fe.quantity}>
                    <Input id="k-qty" name="quantity" inputMode="decimal" defaultValue="1" aria-invalid={!!fe.quantity || undefined} />
                  </Field>
                  <Field id="k-unit" label="Valor de cada" error={fe.unitCost}>
                    <MoneyInput id="k-unit" name="unitCost" aria-invalid={!!fe.unitCost || undefined} />
                  </Field>
                </div>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 text-sm ${bold ? "border-t pt-2.5 font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
