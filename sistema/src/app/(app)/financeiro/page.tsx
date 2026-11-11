import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { currentMonth, isMonth, monthLabel, shiftMonth, todayISO } from "@/lib/dates";
import { getLookups, getPosition, listMonthTransactions, summarize } from "@/features/financeiro/queries";
import { FinanceiroView } from "@/features/financeiro/components/financeiro-view";
import { AccountsCard } from "@/features/financeiro/components/accounts-card";
import { PositionCards } from "@/features/financeiro/components/position-cards";

export const metadata: Metadata = { title: "Dinheiro" };
export const dynamic = "force-dynamic";

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string; novo?: string }> }) {
  const sp = await searchParams;
  const today = todayISO();
  const month = isMonth(sp.mes) ? sp.mes : currentMonth();
  const [lookups, position, rows] = await Promise.all([getLookups(), getPosition(), listMonthTransactions(month)]);
  const sum = summarize(rows);
  const openNew = sp.novo === "entrada" || sp.novo === "despesa" ? sp.novo : undefined;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <PageHeader title="Dinheiro" description="Anote o que entra e o que sai, e veja quanto tem." />

      <PositionCards position={position} />
      <AccountsCard accounts={lookups.accounts} today={today} />

      <div className="flex items-center justify-between gap-2">
        <Link href={`/financeiro?mes=${shiftMonth(month, -1)}`} className="flex size-10 items-center justify-center rounded-full border bg-card hover:bg-accent" aria-label="Mês anterior">
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold">{monthLabel(month)}</h2>
        <Link href={`/financeiro?mes=${shiftMonth(month, 1)}`} className="flex size-10 items-center justify-center rounded-full border bg-card hover:bg-accent" aria-label="Próximo mês">
          <ChevronRight className="size-5" />
        </Link>
      </div>

      <Card className="grid grid-cols-3 divide-x p-0 text-center">
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground">Entrou</p>
          <Money cents={sum.in} tone="in" className="text-base font-bold sm:text-lg" />
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground">Saiu</p>
          <Money cents={sum.out} tone="out" className="text-base font-bold sm:text-lg" />
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground">Sobrou</p>
          <Money cents={sum.result} tone="auto" className="text-base font-bold sm:text-lg" />
        </div>
      </Card>

      {(sum.toReceive > 0 || sum.toPay > 0) && (
        <p className="-mt-2 flex flex-wrap items-center justify-center gap-x-2 text-center text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden />
          Pendente neste mês: <Money cents={sum.toReceive} tone="in" className="font-semibold" /> a receber · <Money cents={sum.toPay} tone="out" className="font-semibold" /> a pagar
        </p>
      )}

      <FinanceiroView rows={rows} lookups={lookups} today={today} openNew={openNew} />
    </div>
  );
}
