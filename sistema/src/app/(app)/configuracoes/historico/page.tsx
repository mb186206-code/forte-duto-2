import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { describeAudit, TABLE_LABEL, type AuditRow } from "@/features/configuracoes/audit";
import { getAuditLogs } from "@/features/configuracoes/queries";

export const metadata: Metadata = { title: "Histórico de alterações" };
export const dynamic = "force-dynamic";

const FILTERS = ["transactions", "customers", "services", "budgets", "campaigns", "accounts", "funds"] as const;

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ tabela?: string }> }) {
  const sp = await searchParams;
  const table = (FILTERS as readonly string[]).includes(sp.tabela ?? "") ? sp.tabela! : null;
  const rows = (await getAuditLogs(table)) as unknown as AuditRow[];
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <Link href="/configuracoes" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Configurações
      </Link>
      <PageHeader title="Quem mudou o quê" description="As últimas alterações feitas no sistema, com o nome de quem fez. Não dá para apagar este histórico." />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar histórico">
        <Link href="/configuracoes/historico" aria-current={!table} className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${!table ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
          Tudo
        </Link>
        {FILTERS.map((t) => (
          <Link key={t} href={`/configuracoes/historico?tabela=${t}`} aria-current={table === t} className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold capitalize ${table === t ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
            {TABLE_LABEL[t]}s
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nenhuma alteração registrada ainda.</p>
      ) : (
        <Card className="p-0">
          <ul className="divide-y">
            {rows.map((r) => {
              const d = describeAudit(r);
              return (
                <li key={r.id} className="px-4 py-3 text-sm">
                  <p>
                    <strong>{r.changed_by}</strong> {d.verb}: <strong>{d.what}</strong>
                  </p>
                  {d.detail && <p className="text-muted-foreground">{d.detail}</p>}
                  <p className="text-xs text-muted-foreground">{fmt.format(new Date(r.changed_at))}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
