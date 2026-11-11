"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, Pencil, Plus, Printer, Trash2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { RunButton } from "@/components/forms/run-button";
import { Money } from "@/components/shared/money";
import { formatBRL } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { whatsappLink } from "@/lib/contact";
import { addBudgetItem, convertBudget, deleteBudget, removeBudgetItem, setBudgetStatus } from "../actions";
import { BudgetForm } from "./budget-form";
import { ITEM_KIND_LABEL, type BudgetRow, type BudgetStatus, type CommercialLookups, type ItemKind, type LineItem } from "../types";

export function BudgetDetail({ budget, items, lookups, today, status }: { budget: BudgetRow; items: LineItem[]; lookups: CommercialLookups; today: string; status: BudgetStatus }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<"item" | "editar" | null>(null);
  const refresh = () => router.refresh();
  const close = () => {
    setSheet(null);
    router.refresh();
  };
  const locked = !!budget.serviceId;
  const text =
    `Olá, ${budget.customerName.split(" ")[0]}! Segue o orçamento nº ${budget.number} da Forte Duto:\n` +
    items.map((i) => `• ${i.description} — ${formatBRL(i.total)}`).join("\n") +
    (budget.discount > 0 ? `\nDesconto: ${formatBRL(budget.discount)}` : "") +
    `\nTotal: ${formatBRL(budget.total)}` +
    (budget.validUntil ? `\nVálido até ${formatDateBR(budget.validUntil)}.` : "");
  const wa = whatsappLink(budget.customerPhone, text);

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Itens</h2>
          {!locked && (
            <Button size="sm" variant="outline" onClick={() => setSheet("item")} data-no-print>
              <Plus /> Adicionar item
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item ainda. Adicione o que será feito e o valor de cada coisa.</p>
        ) : (
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{i.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {ITEM_KIND_LABEL[i.kind]} · {i.quantity.toLocaleString("pt-BR")} × <Money cents={i.unit} />
                  </p>
                </div>
                <Money cents={i.total} className="text-sm font-semibold" />
                {!locked && (
                  <span data-no-print>
                    <RunButton size="icon-sm" variant="ghost" run={() => removeBudgetItem(i.id)} onDone={refresh}>
                      <X />
                      <span className="sr-only">Remover item</span>
                    </RunButton>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-3 grid gap-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Soma dos itens</dt>
            <dd><Money cents={budget.subtotal} /></dd>
          </div>
          {budget.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd>− <Money cents={budget.discount} /></dd>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <dt>Total</dt>
            <dd><Money cents={budget.total} /></dd>
          </div>
        </dl>
      </Card>

      <Card className="grid gap-2 p-4" data-no-print>
        <h2 className="font-semibold">E agora?</h2>
        {budget.serviceId ? (
          <Button asChild size="lg" variant="highlight">
            <Link href={`/servicos/${budget.serviceId}`}>
              <ArrowRight /> Ver o serviço gerado
            </Link>
          </Button>
        ) : (
          <>
            {status === "aprovado" ? (
              <RunButton variant="highlight" run={() => convertBudget(budget.id)} confirm={undefined}>
                <ArrowRight /> Transformar em serviço
              </RunButton>
            ) : (
              <RunButton variant="highlight" run={() => setBudgetStatus(budget.id, "aprovado")} onDone={refresh}>
                <CheckCircle2 /> O cliente aprovou
              </RunButton>
            )}
            <div className="grid grid-cols-2 gap-2">
              {status !== "recusado" && (
                <RunButton size="default" run={() => setBudgetStatus(budget.id, "recusado")} onDone={refresh}>
                  <XCircle /> Recusou
                </RunButton>
              )}
              {status !== "aguardando" && (
                <RunButton size="default" run={() => setBudgetStatus(budget.id, "aguardando")} onDone={refresh}>
                  Voltar a aguardar
                </RunButton>
              )}
              {status === "aguardando" && (
                <RunButton size="default" run={() => setBudgetStatus(budget.id, "expirado")} onDone={refresh}>
                  Deu o prazo
                </RunButton>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Aprovar o orçamento não é dinheiro recebido. O pagamento é anotado depois, no serviço.</p>
          </>
        )}
        <div className="grid grid-cols-2 gap-2">
          {wa && (
            <Button asChild variant="outline" size="default">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle /> Enviar no WhatsApp
              </a>
            </Button>
          )}
          <Button variant="outline" size="default" onClick={() => window.print()}>
            <Printer /> Imprimir / PDF
          </Button>
        </div>
      </Card>

      {!locked && (
        <div className="grid gap-2" data-no-print>
          <Button variant="outline" size="lg" onClick={() => setSheet("editar")}>
            <Pencil /> Editar dados
          </Button>
          <RunButton variant="ghost" className="text-destructive hover:text-destructive" confirm="Apagar este orçamento? Isso não pode ser desfeito." run={() => deleteBudget(budget.id)}>
            <Trash2 /> Apagar orçamento
          </RunButton>
        </div>
      )}

      <BottomSheet open={sheet === "editar"} onOpenChange={(o) => !o && close()} title="Editar orçamento">
        {sheet === "editar" && <BudgetForm budget={budget} lookups={lookups} today={today} onDone={close} />}
      </BottomSheet>

      <BottomSheet open={sheet === "item"} onOpenChange={(o) => !o && close()} title="Adicionar item" description="Um serviço, material ou mão de obra que entra no orçamento.">
        {sheet === "item" && (
          <ActionForm action={addBudgetItem} onDone={close} submitLabel="Adicionar" submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="budgetId" value={budget.id} />
                <Field id="i-desc" label="O que é?" error={fe.description}>
                  <Input id="i-desc" name="description" autoFocus maxLength={200} placeholder="Ex.: Mão de obra de desentupimento" aria-invalid={!!fe.description || undefined} />
                </Field>
                <Field id="i-kind" label="Tipo" error={fe.kind}>
                  <Select id="i-kind" name="kind" defaultValue="mao_de_obra">
                    {(Object.keys(ITEM_KIND_LABEL) as ItemKind[]).map((k) => (
                      <option key={k} value={k}>
                        {ITEM_KIND_LABEL[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="i-qty" label="Quantidade" error={fe.quantity}>
                    <Input id="i-qty" name="quantity" inputMode="decimal" defaultValue="1" aria-invalid={!!fe.quantity || undefined} />
                  </Field>
                  <Field id="i-price" label="Valor de cada" error={fe.unitPrice}>
                    <MoneyInput id="i-price" name="unitPrice" aria-invalid={!!fe.unitPrice || undefined} />
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
