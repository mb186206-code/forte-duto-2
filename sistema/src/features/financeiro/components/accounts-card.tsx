"use client";

import { useState } from "react";
import { ArrowLeftRight, Landmark, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MoneyInput } from "@/components/forms/money-input";
import { ActionForm } from "@/components/forms/action-form";
import { Money } from "@/components/shared/money";
import { saveAccount, transferBetweenAccounts } from "../actions";
import type { AccountRow } from "../types";

const TYPE_LABEL: Record<string, string> = { banco: "Banco", caixa: "Dinheiro em mãos", carteira_digital: "Carteira digital", outro: "Outra" };

export function AccountsCard({ accounts, today }: { accounts: AccountRow[]; today: string }) {
  const [sheet, setSheet] = useState<"conta" | "transferir" | null>(null);
  const close = () => setSheet(null);

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="flex items-center gap-2 font-semibold whitespace-nowrap">
            <Landmark className="size-5 text-info" aria-hidden /> Minhas contas
          </h2>
          <div className="flex gap-2">
            {accounts.length >= 2 && (
              <Button size="sm" variant="outline" onClick={() => setSheet("transferir")}>
                <ArrowLeftRight /> Passar dinheiro
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setSheet("conta")}>
              <Plus /> Nova conta
            </Button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-5 text-center">
            <Wallet className="mx-auto size-8 text-info" aria-hidden />
            <p className="mt-2 font-semibold">Comece criando sua primeira conta</p>
            <p className="mt-1 text-sm text-muted-foreground">Pode ser o banco, o caixa da empresa ou o dinheiro em mãos. É lá que o dinheiro entra e sai.</p>
            <Button className="mt-4" size="lg" variant="highlight" onClick={() => setSheet("conta")}>
              <Plus /> Criar conta
            </Button>
          </div>
        ) : (
          <ul className="mt-3 divide-y">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABEL[a.type] ?? a.type}</p>
                </div>
                <Money cents={a.balance} tone={a.balance < 0 ? "out" : "neutral"} className="text-base font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <BottomSheet open={sheet === "conta"} onOpenChange={(o) => !o && close()} title="Nova conta" description="Onde o dinheiro da empresa fica guardado.">
        {sheet === "conta" && (
          <ActionForm action={saveAccount} onDone={close} submitLabel="Criar conta" submitVariant="highlight">
            {({ fe }) => (
              <>
                <Field id="acc-name" label="Nome da conta" error={fe.name}>
                  <Input id="acc-name" name="name" autoFocus maxLength={80} placeholder="Ex.: Nubank, Caixa da empresa" aria-invalid={!!fe.name || undefined} />
                </Field>
                <Field id="acc-type" label="Que tipo de conta é?" error={fe.type}>
                  <Select id="acc-type" name="type" defaultValue="banco">
                    <option value="banco">Banco</option>
                    <option value="caixa">Dinheiro em mãos (caixa)</option>
                    <option value="carteira_digital">Carteira digital</option>
                    <option value="outro">Outra</option>
                  </Select>
                </Field>
                <Field id="acc-opening" label="Quanto tem nela hoje?" optional hint="Deixe em branco se está zerada." error={fe.openingBalance}>
                  <MoneyInput id="acc-opening" name="openingBalance" aria-invalid={!!fe.openingBalance || undefined} />
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "transferir"} onOpenChange={(o) => !o && close()} title="Passar dinheiro entre contas" description="Não conta como entrada nem como despesa.">
        {sheet === "transferir" && (
          <ActionForm action={transferBetweenAccounts} onDone={close} submitLabel="Passar dinheiro" submitVariant="highlight">
            {({ fe }) => (
              <>
                <Field id="tr-amount" label="Quanto?" error={fe.amount}>
                  <MoneyInput id="tr-amount" name="amount" autoFocus aria-invalid={!!fe.amount || undefined} />
                </Field>
                <Field id="tr-from" label="Sai de qual conta?" error={fe.fromId}>
                  <Select id="tr-from" name="fromId" defaultValue="">
                    <option value="">Escolha…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="tr-to" label="Vai para qual conta?" error={fe.toId}>
                  <Select id="tr-to" name="toId" defaultValue="">
                    <option value="">Escolha…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="tr-date" label="Em que dia?" error={fe.date}>
                  <Input id="tr-date" name="date" type="date" defaultValue={today} />
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>
    </>
  );
}
