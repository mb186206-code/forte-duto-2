import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { currentMonth, formatDateBR, isMonth, monthLabel, monthRange, shiftMonth, todayISO } from "@/lib/dates";
import { formatPercent, sumCents } from "@/lib/money";
import { PLATFORM_LABEL } from "@/lib/utm";
import { getFunds, getMonthlySeries, getPosition, listPending } from "@/features/financeiro/queries";
import { MonthlyChart } from "@/features/financeiro/components/monthly-chart";
import { getMarketingOverview } from "@/features/marketing/queries";
import { CLASS_LABEL, computeFinancials, computeServices, goalProgress } from "@/features/relatorios/compute";
import { getAllServices, getReportTransactions, getSettings, toServiceInput } from "@/features/relatorios/queries";
import { ReportActions } from "@/features/relatorios/components/report-actions";

export const metadata: Metadata = { title: "Relatórios" };
export const dynamic = "force-dynamic";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-2 p-4 break-inside-avoid">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </Card>
  );
}

function Row({ label, children, bold }: { label: React.ReactNode; children: React.ReactNode; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 text-sm ${bold ? "border-t pt-2.5 font-bold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-semibold tabular-nums">{children}</span>
    </div>
  );
}

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const month = isMonth(sp.mes) ? sp.mes : currentMonth();
  const { from, to } = monthRange(month);
  const today = todayISO();

  const [txs, services, funds, series, pending, position, settings, marketing] = await Promise.all([
    getReportTransactions(month),
    getAllServices(),
    getFunds(),
    getMonthlySeries(6, month),
    listPending(),
    getPosition(),
    getSettings(),
    getMarketingOverview({ from, to }),
  ]);

  const fin = computeFinancials(txs, from, to);
  const svc = computeServices(services.map(toServiceInput), from, to);
  const late = pending.filter((t) => (t.dueDate ?? t.competenceDate) < today);
  const receivable = pending.filter((t) => t.kind === "receita");
  const payable = pending.filter((t) => t.kind === "despesa");
  const revGoal = goalProgress(fin.revenue, settings.monthlyRevenueGoal);
  const profitGoal = goalProgress(fin.result, settings.monthlyProfitGoal);
  const reserved = sumCents(funds.map((f) => f.balance));
  const origins = marketing.origins;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <PageHeader title="Relatórios" description="O resumo do mês para ver, imprimir ou baixar em planilha." />

      <div className="flex items-center justify-between gap-2" data-no-print>
        <Link href={`/relatorios?mes=${shiftMonth(month, -1)}`} className="flex size-10 items-center justify-center rounded-full border bg-card hover:bg-accent" aria-label="Mês anterior">
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold">{monthLabel(month)}</h2>
        <Link href={`/relatorios?mes=${shiftMonth(month, 1)}`} className="flex size-10 items-center justify-center rounded-full border bg-card hover:bg-accent" aria-label="Próximo mês">
          <ChevronRight className="size-5" />
        </Link>
      </div>
      <p className="hidden text-center text-sm print:block">{settings.companyName} — relatório de {monthLabel(month)}</p>

      <ReportActions month={month} />

      <Section title="Faturamento e resultado" hint="Pelo dia a que o valor pertence, incluindo o que ainda vai receber ou pagar.">
        <Row label="Faturamento (vendido no mês)"><Money cents={fin.revenue} tone="in" /></Row>
        <Row label="↳ já recebido"><Money cents={fin.revenueReceived} /></Row>
        <Row label="↳ ainda a receber"><Money cents={fin.revenuePending} /></Row>
        <Row label="Custos do serviço"><Money cents={fin.byClass.custo_direto} tone={fin.byClass.custo_direto > 0 ? "out" : "neutral"} /></Row>
        <Row label="Despesas da empresa"><Money cents={fin.byClass.despesa_operacional} tone={fin.byClass.despesa_operacional > 0 ? "out" : "neutral"} /></Row>
        <Row label="Impostos e taxas"><Money cents={fin.byClass.imposto} tone={fin.byClass.imposto > 0 ? "out" : "neutral"} /></Row>
        <Row label="Resultado do mês (lucro)" bold><Money cents={fin.result} tone="auto" /></Row>
        {fin.byClass.investimento > 0 && (
          <p className="text-xs text-muted-foreground">
            Investimentos do mês: <Money cents={fin.byClass.investimento} /> (compra de equipamentos; não entra no lucro).
          </p>
        )}
        {(revGoal !== null || profitGoal !== null) && (
          <div className="mt-2 grid gap-1 rounded-lg bg-secondary/60 p-3 text-sm">
            {revGoal !== null && (
              <p>
                Meta de faturamento: <strong>{formatPercent(revGoal)}</strong> atingida
              </p>
            )}
            {profitGoal !== null && (
              <p>
                Meta de lucro: <strong>{formatPercent(profitGoal)}</strong> atingida
              </p>
            )}
          </div>
        )}
      </Section>

      <Section title="Fluxo de caixa" hint="Só o dinheiro que realmente entrou e saiu das contas neste mês.">
        <Row label="Entrou"><Money cents={fin.cash.in} tone="in" /></Row>
        <Row label="Saiu"><Money cents={fin.cash.out} tone="out" /></Row>
        <Row label="Sobrou no caixa" bold><Money cents={fin.cash.net} tone="auto" /></Row>
        <Row label="Saldo nas contas hoje"><Money cents={position.available} /></Row>
        <Row label="Livre para usar hoje"><Money cents={position.free} /></Row>
      </Section>

      <Section title="Despesas por tipo">
        {fin.expensesByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
        ) : (
          <ul className="divide-y">
            {fin.expensesByCategory.map((c) => (
              <li key={c.cls + c.name} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{CLASS_LABEL[c.cls]}</span>
                </span>
                <Money cents={c.amount} className="font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Serviços" hint="Serviços concluídos neste mês: valor combinado, custos e o que sobra.">
        <Row label="Concluídos no mês">{svc.concluded}</Row>
        <Row label="Em aberto agora">{svc.open}</Row>
        <Row label="Cancelados (total)">{svc.cancelled}</Row>
        {svc.byType.length > 0 && (
          <ul className="mt-1 divide-y border-t">
            {svc.byType.map((t) => (
              <li key={t.name} className="py-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">
                    {t.name} <span className="text-muted-foreground">× {t.count}</span>
                  </span>
                  <Money cents={t.profit} tone="auto" className="font-semibold" />
                </div>
                <p className="text-xs text-muted-foreground">
                  combinado <Money cents={t.contract} /> · custos <Money cents={t.cost} />
                </p>
              </li>
            ))}
          </ul>
        )}
        {svc.concluded > 0 && (
          <Row label="Sobra dos serviços" bold>
            <Money cents={svc.totals.profit} tone="auto" />
          </Row>
        )}
      </Section>

      <Section title="De onde vieram os clientes" hint={`${origins.newCustomers} ${origins.newCustomers === 1 ? "cliente cadastrado" : "clientes cadastrados"} no mês.`}>
        {origins.byType.map((o) => (
          <Row key={o.type} label={o.label}>{o.count}</Row>
        ))}
        {origins.bySource.length > 0 && (
          <ul className="mt-1 divide-y border-t">
            {origins.bySource.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {s.name} {s.paid && <Badge variant="info">Anúncio</Badge>}
                </span>
                <span className="font-semibold">{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Campanhas de anúncios" hint="Investimento, clientes que pagaram e retorno no mês.">
        {marketing.campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
        ) : (
          <>
            <Row label="Gastou em anúncios"><Money cents={marketing.total.spend} tone={marketing.total.spend > 0 ? "out" : "neutral"} /></Row>
            <Row label="Custo por cliente">{marketing.total.costPerClient === null ? "—" : <Money cents={marketing.total.costPerClient} />}</Row>
            <Row label="Retorno (ROI)">{formatPercent(marketing.total.roi)}</Row>
            <ul className="divide-y border-t">
              {marketing.campaigns.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <Link href={`/marketing/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <span className="font-semibold">{formatPercent(c.stats.roi)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_LABEL[c.platform]} · gastou <Money cents={c.stats.spend} /> · {c.stats.contacts} contatos · {c.stats.clients} clientes
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="Pendências" hint="Tudo que ainda não foi recebido ou pago, de qualquer mês.">
        <Row label="A receber"><Money cents={sumCents(receivable.map((t) => t.amount))} tone="in" /></Row>
        <Row label="A pagar"><Money cents={sumCents(payable.map((t) => t.amount))} tone="out" /></Row>
        {late.length > 0 && (
          <>
            <p className="mt-1 text-sm font-semibold text-warning">{late.length} em atraso</p>
            <ul className="divide-y">
              {late.slice(0, 15).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{t.description}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.kind === "receita" ? "Receber" : "Pagar"} até {formatDateBR(t.dueDate ?? t.competenceDate)}
                    </span>
                  </span>
                  <Money cents={t.amount} tone={t.kind === "receita" ? "in" : "out"} className="font-semibold" />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="Fundos da empresa" hint="Dinheiro separado dentro do saldo. Guardar num fundo não é gasto.">
        {funds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum fundo.</p>
        ) : (
          <>
            <ul className="divide-y">
              {funds.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{f.name}</span>
                    {f.targetAmount != null && (
                      <span className="block text-xs text-muted-foreground">
                        Meta <Money cents={f.targetAmount} /> · {formatPercent(f.targetPercent)}
                      </span>
                    )}
                  </span>
                  <Money cents={f.balance} className="font-semibold" />
                </li>
              ))}
            </ul>
            <Row label="Total guardado" bold><Money cents={reserved} /></Row>
          </>
        )}
      </Section>

      <Section title="Evolução (últimos 6 meses)" hint="Entrou × saiu, só dinheiro que realmente entrou e saiu.">
        <MonthlyChart data={series} />
      </Section>
    </div>
  );
}
