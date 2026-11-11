"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle, Plus, Search, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPhone, whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { customerBadge } from "../status";
import { CustomerForm } from "./customer-form";
import { CUSTOMER_STATUS_LABEL, type CommercialLookups, type CustomerRow, type CustomerStatus } from "../types";

type Filter = "todos" | CustomerStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "novo_contato", label: "Novos" },
  { key: "em_atendimento", label: "Em atendimento" },
  { key: "cliente", label: "Clientes" },
  { key: "inativo", label: "Inativos" },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ClientesView({ rows, lookups, openNew }: { rows: CustomerRow[]; lookups: CommercialLookups; openNew?: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(!!openNew);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    const qd = q.replace(/\D/g, "");
    return rows.filter((c) => {
      if (filter !== "todos" && c.status !== filter) return false;
      if (!q) return true;
      return norm(`${c.name} ${c.address ?? ""} ${c.requestedService ?? ""}`).includes(q) || (qd.length >= 3 && `${c.phone ?? ""}${c.whatsapp ?? ""}`.replace(/\D/g, "").includes(qd));
    });
  }, [rows, filter, query]);

  function close() {
    setOpen(false);
    if (openNew) router.replace("/clientes");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Button size="lg" variant="highlight" className="h-12 text-base" onClick={() => setOpen(true)}>
        <UserPlus /> Novo cliente
      </Button>

      {rows.length > 0 && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar cliente" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou telefone" className="h-12 pl-10" />
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar clientes">
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
          icon={Users}
          title="Nenhum cliente ainda"
          description="Cadastre quem pediu um serviço ou orçamento. Basta o nome — o resto você completa depois."
          action={
            <Button size="lg" variant="highlight" onClick={() => setOpen(true)}>
              <Plus /> Cadastrar o primeiro cliente
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nenhum cliente encontrado.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {shown.map((c) => {
            const wa = whatsappLink(c.whatsapp || c.phone);
            return (
              <li key={c.id} className="flex items-center gap-2 pr-2">
                <Link href={`/clientes/${c.id}`} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{formatPhone(c.whatsapp || c.phone) || c.requestedService || "Sem telefone"}</p>
                  </div>
                  <Badge variant={customerBadge(c.status)}>{CUSTOMER_STATUS_LABEL[c.status]}</Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" aria-label={`Chamar ${c.name} no WhatsApp`} className="flex size-11 shrink-0 items-center justify-center rounded-full text-success hover:bg-success-soft">
                    <MessageCircle className="size-5" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Novo cliente" description="Só o nome é obrigatório.">
        {open && <CustomerForm lookups={lookups} onDone={close} />}
      </BottomSheet>
    </div>
  );
}
