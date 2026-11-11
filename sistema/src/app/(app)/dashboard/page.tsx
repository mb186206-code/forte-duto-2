import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickActionList } from "@/components/layout/quick-action-list";
import { Money } from "@/components/shared/money";
import { getCurrentUserName } from "@/lib/access/session";
import { addDays, currentMonth, formatDateBR, monthLabel, spParts, todayISO } from "@/lib/dates";
import { listBudgets, listServices } from "@/features/comercial/queries";
import { effectiveBudgetStatus } from "@/features/comercial/status";
import { SERVICE_STATUS_LABEL } from "@/features/comercial/types";
import { getMonthlySeries, getPosition, listMonthTransactions, listPending, listRecent, summarize } from "@/features/financeiro/queries";
import { PositionCards } from "@/features/financeiro/components/position-cards";
import { MonthlyChart } from "@/features/financeiro/components/monthly-chart";

export const metadata: Metadata = { title: "Início" };
export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()),
  );
  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const firstName = ((await getCurrentUserName()) ?? "").split(" ")[0];
  const today = todayISO();
  const month = currentMonth();
  const [position, monthRows, pending, recent, series, services, budgets] = await Promise.all([
    getPosition(),
    listMonthTransactions(month),
    listPending(),
    listRecent(5),
    getMonthlySeries(6, month),
    listServices(),
    listBudgets(),
  ]);
  const openServices = services.filter((x) => x.status !== "concluido" && x.status !== "cancelado");
  const todayServices = openServices.filter((x) => spParts(x.scheduledAt)?.date === today);
  const lateServices = openServices.filter((x) => (spParts(x.scheduledAt)?.date ?? today) < today);
  const waitingBudgets = budgets.filter((b) => effectiveBudgetStatus(b, today) === "aguardando");
  const sum = summarize(monthRows);
  const soon = addDays(today, 7);
  const dueSoon = pending.filter((t) => (t.dueDate ?? t.competenceDate) <= soon).slice(0, 6);
  const isLate = (d: string) => d < today;
  const todayText = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">{todayText}</p>
        <h1 className="mt-0.5 text-[1.75rem] leading-tight font-bold tracking-tight">
          {greeting()}, {firstName}!
        </h1>
      </div>

      <section aria-labelledby="acoes" className="grid gap-3">
        <h2 id="acoes" className="text-base font-semibold">
          O que você quer fazer?
        </h2>
        <QuickActionList />
      </section>

      <Card className="p-4">
        <h2 className="font-semibold">Serviços de hoje</h2>
        {todayServices.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nenhum serviço marcado para hoje.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {todayServices.map((x) => (
              <li key={x.id}>
                <Link href={`/servicos/${x.id}`} className="flex items-center gap-3 py-2.5">
                  <span className="w-12 shrink-0 text-sm font-bold tabular-nums">{spParts(x.scheduledAt)?.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{x.customerName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{x.typeName ?? x.description ?? "Serviço"}</span>
                  </span>
                  <Badge>{SERVICE_STATUS_LABEL[x.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {(lateServices.length > 0 || waitingBudgets.length > 0) && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-sm">
            {lateServices.length > 0 && (
              <Link href="/servicos" className="font-medium text-warning">
                {lateServices.length} {lateServices.length === 1 ? "serviço atrasado" : "serviços atrasados"}
              </Link>
            )}
            {waitingBudgets.length > 0 && (
              <Link href="/orcamentos" className="font-medium text-info">
                {waitingBudgets.length} {waitingBudgets.length === 1 ? "orçamento aguardando resposta" : "orçamentos aguardando resposta"}
              </Link>
            )}
          </p>
        )}
      </Card>

      <PositionCards position={position} />

      <Card className="grid grid-cols-3 divide-x p-0 text-center">
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground">Entrou</p>
          <Money cents={sum.in} tone="in" className="text-base font-bold" />
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground">Saiu</p>
          <Money cents={sum.out} tone="out" className="text-base font-bold" />
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground">Sobrou</p>
          <Money cents={sum.result} tone="auto" className="text-base font-bold" />
        </div>
      </Card>
      <p className="-mt-3 text-center text-xs text-muted-foreground">{monthLabel(month)}</p>

      {dueSoon.length > 0 && (
        <Card className="p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5 text-warning" aria-hidden /> Contas e recebimentos próximos
          </h2>
          <ul className="mt-2 divide-y">
            {dueSoon.map((t) => {
              const due = t.dueDate ?? t.competenceDate;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t.description}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.kind === "receita" ? "Receber" : "Pagar"} até {formatDateBR(due)} {isLate(due) && <Badge variant="danger">Atrasado</Badge>}
                    </span>
                  </span>
                  <Money cents={t.amount} tone={t.kind === "receita" ? "in" : "out"} className="shrink-0 font-semibold" />
                </li>
              );
            })}
          </ul>
          <Link href="/financeiro" className="mt-2 block text-sm font-medium text-info">
            Ver tudo em Dinheiro
          </Link>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="font-semibold">Entrou × saiu (últimos 6 meses)</h2>
        <MonthlyChart data={series} />
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">Últimos lançamentos</h2>
        {recent.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Ainda não há lançamentos. Toque em “Recebi dinheiro” ou “Paguei uma conta” para começar.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                {t.kind === "receita" ? <ArrowDownCircle className="size-5 shrink-0 text-success" aria-hidden /> : t.kind === "despesa" ? <ArrowUpCircle className="size-5 shrink-0 text-destructive" aria-hidden /> : <span className="size-5 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.description}</span>
                  <span className="block text-xs text-muted-foreground">{formatDateBR(t.date)}{t.status === "pendente" ? " · pendente" : ""}</span>
                </span>
                <Money cents={t.kind === "despesa" ? -t.amount : t.amount} tone={t.kind === "transferencia" ? "neutral" : "auto"} signed={t.kind !== "transferencia"} className="shrink-0 text-sm font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
