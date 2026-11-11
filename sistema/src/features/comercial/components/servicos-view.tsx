"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Search, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { dayTitle, spParts } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { serviceBadge } from "../status";
import { ServiceForm } from "./service-form";
import { SERVICE_STATUS_LABEL, type CommercialLookups, type ServiceRow } from "../types";

type Filter = "abertos" | "hoje" | "concluidos" | "todos";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "abertos", label: "Em aberto" },
  { key: "hoje", label: "Hoje" },
  { key: "concluidos", label: "Concluídos" },
  { key: "todos", label: "Todos" },
];
const isOpen = (s: ServiceRow) => s.status !== "concluido" && s.status !== "cancelado";
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ServicosView({ rows, lookups, today, openNew, customerId }: { rows: ServiceRow[]; lookups: CommercialLookups; today: string; openNew?: boolean; customerId?: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("abertos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(!!openNew);

  const groups = useMemo(() => {
    const q = norm(query.trim());
    const list = rows.filter((s) => {
      const day = spParts(s.scheduledAt)?.date ?? null;
      if (filter === "abertos" && !isOpen(s)) return false;
      if (filter === "hoje" && !(isOpen(s) && day === today)) return false;
      if (filter === "concluidos" && s.status !== "concluido") return false;
      if (!q) return true;
      return norm(`${s.customerName} ${s.typeName ?? ""} ${s.description ?? ""} ${s.address ?? ""}`).includes(q);
    });
    const byDay = new Map<string, ServiceRow[]>();
    for (const s of list) {
      const key = spParts(s.scheduledAt)?.date ?? (filter === "concluidos" || filter === "todos" ? s.requestedDate : "sem-data");
      byDay.set(key, [...(byDay.get(key) ?? []), s]);
    }
    const keys = [...byDay.keys()].sort((a, b) => (a === "sem-data" ? 1 : b === "sem-data" ? -1 : filter === "concluidos" || filter === "todos" ? b.localeCompare(a) : a.localeCompare(b)));
    return keys.map((k) => ({ key: k, items: byDay.get(k)! }));
  }, [rows, filter, query, today]);

  function close() {
    setOpen(false);
    if (openNew) router.replace("/servicos");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Button size="lg" variant="highlight" className="h-12 text-base" onClick={() => setOpen(true)}>
        <Plus /> Novo serviço
      </Button>

      {rows.length > 0 && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar serviço" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente ou endereço" className="h-12 pl-10" />
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar serviços">
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
          icon={Wrench}
          title="Nenhum serviço ainda"
          description="Anote cada atendimento: cliente, dia, valor combinado. Depois você registra os custos e o pagamento."
          action={
            <Button size="lg" variant="highlight" onClick={() => setOpen(true)}>
              <Plus /> Anotar o primeiro serviço
            </Button>
          }
        />
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nenhum serviço nesta lista.</p>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="grid gap-2">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground capitalize">{g.key === "sem-data" ? "Sem dia marcado" : dayTitle(g.key, today)}</h2>
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
              {g.items.map((s) => {
                const t = spParts(s.scheduledAt);
                return (
                  <li key={s.id}>
                    <Link href={`/servicos/${s.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-accent/50">
                      <div className="w-12 shrink-0 text-center text-sm font-bold tabular-nums">{t ? t.time : "—"}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.customerName}</p>
                        <p className="truncate text-sm text-muted-foreground">{[s.typeName ?? s.description, s.address].filter(Boolean).join(" · ") || "Sem detalhes"}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={serviceBadge(s.status)}>{SERVICE_STATUS_LABEL[s.status]}</Badge>
                        {s.contractValue != null && <span className="text-xs font-semibold"><Money cents={s.contractValue} /></span>}
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Novo serviço" description="Anote o atendimento. Dá para completar depois.">
        {open && <ServiceForm lookups={lookups} customerId={customerId} onDone={close} />}
      </BottomSheet>
    </div>
  );
}
