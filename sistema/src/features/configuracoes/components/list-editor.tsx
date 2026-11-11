"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ActionForm } from "@/components/forms/action-form";
import { RunButton } from "@/components/forms/run-button";
import type { ListKey } from "@/lib/validation/configuracoes";
import { saveListItem, setListItemActive } from "../actions";
import type { ListItem } from "../queries";

const CLASS_LABEL: Record<string, string> = {
  custo_direto: "Custo do serviço",
  despesa_operacional: "Despesa da empresa",
  imposto: "Imposto ou taxa",
  investimento: "Investimento",
};

/** Lista editável: adicionar, renomear e esconder itens (sem apagar, para não perder histórico). */
export function ListEditor({ listKey, title, description, items }: { listKey: ListKey; title: string; description: string; items: ListItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ListItem | "novo" | null>(null);
  const close = () => {
    setEditing(null);
    router.refresh();
  };
  const item = editing && editing !== "novo" ? editing : null;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing("novo")}>
          <Plus /> Adicionar
        </Button>
      </div>
      <ul className="mt-2 divide-y">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-2 py-2">
            <div className={`min-w-0 flex-1 ${i.active ? "" : "opacity-50"}`}>
              <p className="truncate text-sm font-medium">{i.name}</p>
              {i.classification && <p className="text-xs text-muted-foreground">{CLASS_LABEL[i.classification]}</p>}
              {i.paid && <Badge variant="info">Anúncio pago</Badge>}
            </div>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(i)}>
              <Pencil />
              <span className="sr-only">Editar {i.name}</span>
            </Button>
            <RunButton size="icon-sm" variant="ghost" run={() => setListItemActive(listKey, i.id, !i.active)} onDone={() => router.refresh()}>
              {i.active ? <EyeOff /> : <Eye />}
              <span className="sr-only">{i.active ? `Esconder ${i.name}` : `Mostrar ${i.name}`}</span>
            </RunButton>
          </li>
        ))}
      </ul>

      <BottomSheet open={editing !== null} onOpenChange={(o) => !o && close()} title={item ? "Editar" : "Adicionar"} description={title}>
        {editing !== null && (
          <ActionForm action={saveListItem} onDone={close} submitLabel={item ? "Salvar" : "Adicionar"} submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="list" value={listKey} />
                {item && <input type="hidden" name="id" value={item.id} />}
                <Field id="li-name" label="Nome" error={fe.name}>
                  <Input id="li-name" name="name" autoFocus defaultValue={item?.name} maxLength={80} aria-invalid={!!fe.name || undefined} />
                </Field>
                {listKey === "despesa" && (
                  <Field id="li-class" label="Como entra no resultado?" hint="Custos do serviço e despesas descontam do lucro; investimento não." error={fe.classification}>
                    <Select id="li-class" name="classification" defaultValue={item?.classification ?? "despesa_operacional"}>
                      {Object.entries(CLASS_LABEL).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                {listKey === "origem" && (
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-secondary/60 px-4 py-3">
                    <input type="checkbox" name="paid" defaultChecked={item?.paid} className="size-5" />
                    <span className="font-medium">É anúncio pago</span>
                  </label>
                )}
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>
    </Card>
  );
}
