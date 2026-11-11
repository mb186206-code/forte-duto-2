import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronRight as Go, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { currentMonth, isMonth, monthLabel, monthRange, shiftMonth } from "@/lib/dates";
import { formatPercent } from "@/lib/money";
import { PLATFORM_LABEL } from "@/lib/utm";
import { getCommercialLookups } from "@/features/comercial/queries";
import { getMarketingOverview } from "@/features/marketing/queries";
import { CAMPAIGN_STATUS_LABEL } from "@/features/marketing/types";
import { NewCampaignButton } from "@/features/marketing/components/new-campaign-button";
import { StatGrid } from "@/features/marketing/components/stat-grid";

export const metadata: Metadata = { title: "Marketing e anúncios" };
export const dynamic = "force-dynamic";

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ mes?: string; novo?: string }> }) {
  const sp = await searchParams;
  const all = sp.mes === "tudo";
  const month = isMonth(sp.mes) ? sp.mes : currentMonth();
  const [{ campaigns, total, origins }, lookups] = await Promise.all([getMarketingOverview(all ? null : monthRange(month)), getCommercialLookups()]);
  const hasData = campaigns.length > 0;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <PageHeader title="Marketing e anúncios" description="Quanto você gastou em anúncios e quantos clientes vieram deles." />
      <NewCampaignButton serviceTypes={lookups.serviceTypes} openNew={sp.novo === "1"} />

      <div className="flex items-center justify-between gap-2">
        <Link href={`/marketing?mes=${shiftMonth(month, -1)}`} className="flex size-10 items-center justify-center rounded-full border bg-card hover:bg-accent" aria-label="Mês anterior">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="text-center">
          <h2 className="text-lg font-bold">{all ? "Todo o período" : monthLabel(month)}</h2>
          <Link href={all ? "/marketing" : "/marketing?mes=tudo"} className="text-sm font-medium text-info">
            {all ? "Ver só este mês" : "Ver tudo"}
          </Link>
        </div>
        <Link href={`/marketing?mes=${shiftMonth(month, 1)}`} className="flex size-10 items-center justify-center rounded-full border bg-card hover:bg-accent" aria-label="Próximo mês">
          <ChevronRight className="size-5" />
        </Link>
      </div>

      {!hasData ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha ainda"
          description="Crie uma campanha para cada anúncio ou grupo de anúncios. Depois lance quanto gastou e ligue os clientes que vieram dela."
        />
      ) : (
        <>
          <StatGrid s={total} />

          <Card className="p-4">
            <h2 className="font-semibold">De onde vieram os clientes novos</h2>
            <p className="text-xs text-muted-foreground">{origins.newCustomers} cadastrados neste período</p>
            <ul className="mt-2 divide-y">
              {origins.byType.map((o) => (
                <li key={o.type} className="flex items-center justify-between py-2 text-sm">
                  <span>{o.label}</span>
                  <span className="font-semibold tabular-nums">{o.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Rastreada</strong>: entrou por um link com código. <strong>Declarada</strong>: o cliente contou. Quando não dá para saber, fica como desconhecida — sem chute.
            </p>
            {origins.bySource.length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-semibold">Como disseram que conheceram</h3>
                <ul className="mt-1 divide-y">
                  {origins.bySource.map((s) => (
                    <li key={s.name} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        {s.name} {s.paid && <Badge variant="info">Anúncio</Badge>}
                      </span>
                      <span className="font-semibold tabular-nums">{s.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <section className="grid gap-2">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">Campanhas</h2>
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link href={`/marketing/${c.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-accent/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {PLATFORM_LABEL[c.platform]} · gastou <Money cents={c.stats.spend} /> · {c.stats.contacts} contatos · {c.stats.clients} clientes
                        {c.stats.roi !== null ? ` · ROI ${formatPercent(c.stats.roi)}` : ""}
                      </p>
                    </div>
                    <Badge variant={c.status === "ativa" ? "success" : c.status === "pausada" ? "warning" : "outline"}>{CAMPAIGN_STATUS_LABEL[c.status]}</Badge>
                    <Go className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
