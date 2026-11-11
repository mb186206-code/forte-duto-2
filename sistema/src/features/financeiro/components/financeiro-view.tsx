"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { dayTitle } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { TxForm } from "./tx-form";
import { TxDetail } from "./tx-detail";
import type { Lookups, TxRow } from "../types";

type Filter = "todos" | "entradas" | "saidas" | "pendentes";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Tudo" },
  { key: "entradas", label: "Entradas" },
  { key: "saidas", label: "Saídas" },
  { key: "pendentes", label: "Pendentes" },
];

type SheetState = { type: "form"; kind: "receita" | "despesa"; tx?: TxRow } | { type: "detail"; tx: TxRow } | null;

function matches(tx: TxRow, f: Filter, q: string): boolean {
  if (f === "entradas" && tx.kind !== "receita") return false;
  if (f === "saidas" && tx.kind !== "despesa") return false;
  if (f === "pendentes" && tx.status !== "pendente") return false;
  if (!q) return true;
  const hay = `${tx.description} ${tx.categoryName ?? ""} ${tx.accountName ?? ""} ${tx.supplier ?? ""}`.toLowerCase();
  return hay.includes(q);
}

export function FinanceiroView({ rows, lookups, today, openNew }: { rows: TxRow[]; lookups: Lookups; today: string; openNew?: "entrada" | "despesa" }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<SheetState>(openNew ? { type: "form", kind: openNew === "entrada" ? "receita" : "despesa" } : null);
  const noAccount = lookups.accounts.length === 0;

  const visible = useMemo(() => rows.filter((r) => matches(r, filter, query.trim().toLowerCase())), [rows, filter, query]);
  const groups = useMemo(() => {
    const map = new Map<string, TxRow[]>();
    for (const r of visible) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [visible]);

  function closeSheet() {
    setSheet(null);
    if (openNew) router.replace("/financeiro");
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-14 bg-success text-base text-white hover:bg-success/90" onClick={() => setSheet({ type: "form", kind: "receita" })}>
          <ArrowDownCircle className="size-5" /> Recebi dinheiro
        </Button>
        <Button size="lg" variant="outline" className="h-14 border-destructive/40 text-base text-destructive hover:bg-danger-soft hover:text-destructive" onClick={() => setSheet({ type: "form", kind: "despesa" })}>
          <ArrowUpCircle className="size-5" /> Paguei uma conta
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar lançamento…" className="pl-9" aria-label="Procurar lançamento" />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrar lançamentos">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
              filter === f.key ? "border-brand-navy bg-brand-navy text-white dark:border-brand-yellow dark:bg-brand-yellow dark:text-brand-navy" : "bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={rows.length === 0 ? "Nenhum lançamento neste mês" : "Nada encontrado"}
          description={rows.length === 0 ? (noAccount ? "Crie uma conta primeiro e depois anote o dinheiro que entra e sai." : "Toque em “Recebi dinheiro” ou “Paguei uma conta” para anotar o primeiro.") : "Tente outro filtro ou outra palavra."}
        />
      ) : (
        <div className="grid gap-5">
          {groups.map(([date, items]) => (
            <section key={date} aria-label={dayTitle(date, today)}>
              <h3 className="mb-1.5 px-1 text-sm font-semibold text-muted-foreground first-letter:uppercase">{dayTitle(date, today)}</h3>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {items.map((tx) => (
                  <li key={tx.id}>
                    <button onClick={() => setSheet({ type: "detail", tx })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/60 active:bg-accent">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full",
                          tx.kind === "receita" && "bg-success-soft text-success",
                          tx.kind === "despesa" && "bg-danger-soft text-destructive",
                          tx.kind === "transferencia" && "bg-info-soft text-info",
                        )}
                      >
                        {tx.kind === "receita" ? <ArrowDownCircle className="size-5" /> : tx.kind === "despesa" ? <ArrowUpCircle className="size-5" /> : <ArrowLeftRight className="size-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate font-medium", tx.status === "cancelado" && "line-through opacity-60")}>{tx.description}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {tx.kind === "transferencia" ? `${tx.accountName} → ${tx.toAccountName}` : [tx.categoryName, tx.accountName].filter(Boolean).join(" · ") || "Sem conta"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <Money
                          cents={tx.kind === "despesa" ? -tx.amount : tx.amount}
                          tone={tx.status === "cancelado" || tx.kind === "transferencia" ? "neutral" : "auto"}
                          signed={tx.kind !== "transferencia"}
                          className={cn("block font-semibold", tx.status === "cancelado" && "line-through opacity-60")}
                        />
                        {tx.status === "pendente" && <Badge variant="warning">{tx.kind === "receita" ? "A receber" : "A pagar"}</Badge>}
                        {tx.status === "cancelado" && <Badge variant="outline">Cancelado</Badge>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <BottomSheet
        open={sheet?.type === "form"}
        onOpenChange={(o) => !o && closeSheet()}
        title={sheet?.type === "form" ? (sheet.tx ? "Editar lançamento" : sheet.kind === "receita" ? "Recebi dinheiro" : "Paguei uma conta") : ""}
      >
        {sheet?.type === "form" &&
          (noAccount ? (
            <div className="grid gap-3 pb-2 text-center">
              <p className="text-sm text-muted-foreground">Antes de anotar, crie uma conta (banco, caixa ou dinheiro em mãos) na área “Minhas contas”, logo acima.</p>
              <Button size="lg" onClick={closeSheet}>
                Entendi
              </Button>
            </div>
          ) : (
            <TxForm kind={sheet.kind} tx={sheet.tx} lookups={lookups} today={today} onDone={closeSheet} />
          ))}
      </BottomSheet>

      <BottomSheet open={sheet?.type === "detail"} onOpenChange={(o) => !o && setSheet(null)} title={sheet?.type === "detail" ? (sheet.tx.kind === "transferencia" ? "Transferência" : sheet.tx.kind === "receita" ? "Entrada" : "Despesa") : ""}>
        {sheet?.type === "detail" && (
          <TxDetail
            tx={sheet.tx}
            lookups={lookups}
            today={today}
            onClose={() => setSheet(null)}
            onEdit={() => setSheet({ type: "form", kind: sheet.tx.kind === "receita" ? "receita" : "despesa", tx: sheet.tx })}
          />
        )}
      </BottomSheet>
    </div>
  );
}
