"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FilePlus2, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { budgetBadge, effectiveBudgetStatus } from "../status";
import { BudgetForm } from "./budget-form";
import { BUDGET_STATUS_LABEL, type BudgetRow, type CommercialLookups } from "../types";

type Filter = "todos" | "aguardando" | "aprovado" | "fechados";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "aprovado", label: "Aprovados" },
  { key: "fechados", label: "Recusados e vencidos" },
];
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function OrcamentosView({ rows, lookups, today, openNew, customerId }: { rows: BudgetRow[]; lookups: CommercialLookups; today: string; openNew?: boolean; customerId?: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(!!openNew);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    return rows.filter((b) => {
      const s = effectiveBudgetStatus(b, today);
      if (filter === "aguardando" && s !== "aguardando") return false;
      if (filter === "aprovado" && s !== "aprovado") return false;
      if (filter === "fechados" && s !== "recusado" && s !== "expirado") return false;
      return !q || norm(`${b.customerName} ${b.description ?? ""} ${b.number}`).includes(q);
    });
  }, [rows, filter, query, today]);

  function close() {
    setOpen(false);
    if (openNew) router.replace("/orcamentos");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Button size="lg" variant="highlight" className="h-12 text-base" onClick={() => setOpen(true)}>
        <FilePlus2 /> Novo orçamento
      </Button>

      {rows.length > 0 && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar orçamento" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente ou número" className="h-12 pl-10" />
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar orçamentos">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn("h-10 shrink-0 rounded-full border px-4 text-sm font-semibold", filter === f.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento ainda"
          description="Monte o orçamento com os itens e o valor. Quando o cliente aprovar, um toque transforma em serviço."
          action={
            <Button size="lg" variant="highlight" onClick={() => setOpen(true)}>
              <FilePlus2 /> Fazer o primeiro orçamento
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nenhum orçamento nesta lista.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {shown.map((b) => {
            const s = effectiveBudgetStatus(b, today);
            return (
              <li key={b.id}>
                <Link href={`/orcamentos/${b.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      Nº {b.number} · {b.customerName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{formatDateBR(b.issueDate)}{b.validUntil ? ` · vale até ${formatDateBR(b.validUntil)}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={budgetBadge(s)}>{BUDGET_STATUS_LABEL[s]}</Badge>
                    <span className="text-sm font-bold"><Money cents={b.total} /></span>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Novo orçamento" description="Primeiro os dados; os itens vêm na próxima tela.">
        {open && <BudgetForm lookups={lookups} customerId={customerId} today={today} onDone={close} />}
      </BottomSheet>
    </div>
  );
}
