"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, ArrowDownToLine, ArrowUpFromLine, Plus, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MoneyInput } from "@/components/forms/money-input";
import { ActionForm } from "@/components/forms/action-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { formatDateBR } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { archiveFund, moveFund, saveFund } from "../actions";
import type { FundMovementRow, FundRow } from "@/features/financeiro/types";

type Sheet = { type: "novo" } | { type: "mover"; fund: FundRow; kind: "deposito" | "retirada" } | null;

function Progress({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}

export function FundosView({ funds, movements, today }: { funds: FundRow[]; movements: Record<string, FundMovementRow[]>; today: string }) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [archiving, startArchive] = useTransition();
  const close = () => setSheet(null);

  function archive(f: FundRow) {
    startArchive(async () => {
      const r = await archiveFund(f.id);
      if (r.status === "success") toast.success(r.message);
      else toast.error(r.message ?? "Não foi possível arquivar.");
    });
  }

  return (
    <div className="grid gap-4">
      <Button size="lg" variant="highlight" className="h-12" onClick={() => setSheet({ type: "novo" })}>
        <Plus /> Novo fundo
      </Button>

      {funds.length === 0 ? (
        <EmptyState icon={PiggyBank} title="Nenhum fundo ainda" description="Crie um fundo para separar dinheiro para um objetivo, como emergência ou equipamentos." />
      ) : (
        funds.map((f) => (
          <Card key={f.id} className="grid gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{f.name}</h2>
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
              </div>
              <Money cents={f.balance} className="shrink-0 text-xl font-bold" />
            </div>

            {f.targetAmount !== null && (
              <div className="grid gap-1.5">
                <Progress percent={f.targetPercent ?? 0} />
                <p className="text-xs text-muted-foreground">
                  {f.targetPercent !== null ? `${f.targetPercent.toLocaleString("pt-BR")}% da meta` : ""} · Meta {formatBRL(f.targetAmount)}
                  {f.targetAmount > f.balance ? ` · Faltam ${formatBRL(f.targetAmount - f.balance)}` : " · Meta alcançada!"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => setSheet({ type: "mover", fund: f, kind: "deposito" })}>
                <ArrowDownToLine /> Guardar
              </Button>
              <Button variant="outline" size="lg" onClick={() => setSheet({ type: "mover", fund: f, kind: "retirada" })} disabled={f.balance <= 0}>
                <ArrowUpFromLine /> Tirar
              </Button>
            </div>

            {(movements[f.id] ?? []).length > 0 && (
              <details className="group rounded-lg border bg-secondary/40">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Últimos movimentos</summary>
                <ul className="divide-y border-t">
                  {movements[f.id].map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block">{m.kind === "deposito" ? "Guardou" : "Tirou"}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatDateBR(m.date)} · {m.createdBy}
                          {m.notes ? ` · ${m.notes}` : ""}
                        </span>
                      </span>
                      <Money cents={m.kind === "deposito" ? m.amount : -m.amount} tone="auto" signed className="font-semibold" />
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <button onClick={() => archive(f)} disabled={archiving} className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Archive className="size-3.5" /> Arquivar este fundo
            </button>
          </Card>
        ))
      )}

      <BottomSheet open={sheet?.type === "novo"} onOpenChange={(o) => !o && close()} title="Novo fundo" description="Dinheiro separado para um objetivo.">
        {sheet?.type === "novo" && (
          <ActionForm action={saveFund} onDone={close} submitLabel="Criar fundo" submitVariant="highlight">
            {({ fe }) => (
              <>
                <Field id="fund-name" label="Nome do fundo" error={fe.name}>
                  <Input id="fund-name" name="name" autoFocus maxLength={80} placeholder="Ex.: Troca do caminhão" aria-invalid={!!fe.name || undefined} />
                </Field>
                <Field id="fund-target" label="Meta" optional hint="Quanto você quer juntar." error={fe.target}>
                  <MoneyInput id="fund-target" name="target" aria-invalid={!!fe.target || undefined} />
                </Field>
                <Field id="fund-desc" label="Para que serve?" optional error={fe.description}>
                  <Textarea id="fund-desc" name="description" rows={2} maxLength={500} />
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>

      <BottomSheet
        open={sheet?.type === "mover"}
        onOpenChange={(o) => !o && close()}
        title={sheet?.type === "mover" ? (sheet.kind === "deposito" ? `Guardar em ${sheet.fund.name}` : `Tirar de ${sheet.fund.name}`) : ""}
        description={sheet?.type === "mover" ? (sheet.kind === "deposito" ? "Não é despesa: o dinheiro continua seu, só fica separado." : `Tem ${formatBRL(sheet.fund.balance)} guardado.`) : undefined}
      >
        {sheet?.type === "mover" && (
          <ActionForm action={moveFund} onDone={close} submitLabel={sheet.kind === "deposito" ? "Guardar dinheiro" : "Tirar dinheiro"} submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="fundId" value={sheet.fund.id} />
                <input type="hidden" name="kind" value={sheet.kind} />
                <Field id="mv-amount" label="Quanto?" error={fe.amount}>
                  <MoneyInput id="mv-amount" name="amount" autoFocus aria-invalid={!!fe.amount || undefined} />
                </Field>
                <Field id="mv-date" label="Em que dia?" error={fe.date}>
                  <Input id="mv-date" name="date" type="date" defaultValue={today} />
                </Field>
                <Field id="mv-notes" label="Observação" optional error={fe.notes}>
                  <Input id="mv-notes" name="notes" maxLength={500} />
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>
    </div>
  );
}
