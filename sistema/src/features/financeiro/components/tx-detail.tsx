"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ActionForm } from "@/components/forms/action-form";
import { Money } from "@/components/shared/money";
import { formatDateBR } from "@/lib/dates";
import { cancelTransaction, deleteTransaction, settleTransaction } from "../actions";
import type { Lookups, TxRow } from "../types";

const STATUS_LABEL = (tx: TxRow) =>
  tx.status === "cancelado" ? "Cancelado" : tx.status === "pendente" ? (tx.kind === "receita" ? "A receber" : "A pagar") : tx.kind === "receita" ? "Recebido" : tx.kind === "despesa" ? "Pago" : "Feita";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

export function TxDetail({ tx, lookups, today, onEdit, onClose }: { tx: TxRow; lookups: Lookups; today: string; onEdit: () => void; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isTransfer = tx.kind === "transferencia";
  const tone = tx.kind === "receita" ? "in" : tx.kind === "despesa" ? "out" : "neutral";

  function run(fn: () => Promise<{ status: string; message?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.status === "success") {
        toast.success(r.message);
        onClose();
      } else toast.error(r.message ?? "Não foi possível concluir.");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl bg-secondary/60 p-4 text-center">
        <p className="text-sm text-muted-foreground">{tx.description}</p>
        <p className="mt-1 text-3xl font-bold">
          <Money cents={tx.amount} tone={tx.status === "cancelado" ? "neutral" : tone} className={tx.status === "cancelado" ? "line-through opacity-60" : undefined} />
        </p>
        <Badge className="mt-2" variant={tx.status === "pendente" ? "warning" : tx.status === "cancelado" ? "outline" : "success"}>
          {STATUS_LABEL(tx)}
        </Badge>
      </div>

      <dl>
        <Row label={tx.status === "pendente" ? "Vence em" : tx.kind === "receita" ? "Recebido em" : "Pago em"} value={formatDateBR(tx.date)} />
        <Row label={isTransfer ? "Saiu de" : "Conta"} value={tx.accountName} />
        {isTransfer && <Row label="Foi para" value={tx.toAccountName} />}
        <Row label="Tipo" value={tx.categoryName} />
        <Row label="Forma de pagamento" value={tx.paymentMethodName} />
        <Row label="Pago a" value={tx.supplier} />
        <Row label="Observação" value={tx.notes} />
        <Row label="Anotado por" value={tx.createdBy} />
      </dl>

      {tx.status === "pendente" && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">{tx.kind === "receita" ? "Já recebeu?" : "Já pagou?"}</h3>
          <ActionForm action={settleTransaction} onDone={onClose} submitLabel={tx.kind === "receita" ? "Marcar como recebido" : "Marcar como pago"} submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="id" value={tx.id} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="settle-date" label="Em que dia?" error={fe.date}>
                    <Input id="settle-date" name="date" type="date" defaultValue={today} />
                  </Field>
                  <Field id="settle-account" label="Em qual conta?" error={fe.accountId}>
                    <Select id="settle-account" name="accountId" defaultValue={tx.accountId ?? (lookups.accounts.length === 1 ? lookups.accounts[0].id : "")}>
                      <option value="">Escolha…</option>
                      {lookups.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </>
            )}
          </ActionForm>
        </div>
      )}

      <div className="grid gap-2">
        {!isTransfer && tx.status !== "cancelado" && (
          <Button variant="outline" size="lg" onClick={onEdit} disabled={pending}>
            <Pencil /> Editar
          </Button>
        )}
        {!isTransfer && tx.status !== "cancelado" && (
          <Button variant="outline" size="lg" onClick={() => run(() => cancelTransaction(tx.id))} loading={pending}>
            <Ban /> Cancelar (não conta nos cálculos)
          </Button>
        )}
        {confirmDelete ? (
          <div className="grid gap-2 rounded-xl border border-destructive/30 bg-danger-soft p-3">
            <p className="text-sm font-medium">Apagar de vez? Isso não pode ser desfeito.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={pending}>
                Não
              </Button>
              <Button variant="destructive" onClick={() => run(() => deleteTransaction(tx.id))} loading={pending}>
                <CheckCircle2 /> Sim, apagar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="lg" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} disabled={pending}>
            <Trash2 /> Apagar
          </Button>
        )}
      </div>
    </div>
  );
}
