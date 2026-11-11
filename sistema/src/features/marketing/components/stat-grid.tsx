import { Card } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { formatPercent } from "@/lib/money";
import type { CampaignStats } from "../types";

const n = (v: number) => v.toLocaleString("pt-BR");

function Stat({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{children}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/** Os números de marketing em palavras simples. "—" quer dizer que ainda não dá para calcular. */
export function StatGrid({ s }: { s: CampaignStats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Gastou em anúncios"><Money cents={s.spend} tone={s.spend > 0 ? "out" : "neutral"} /></Stat>
      <Stat label="Pessoas que chamaram" hint={s.conversations > 0 ? `${n(s.conversations)} conversas pelos anúncios` : undefined}>{n(s.contacts)}</Stat>
      <Stat label="Viraram clientes" hint="Já pagaram alguma coisa">{n(s.clients)}</Stat>
      <Stat label="Pagaram no total"><Money cents={s.revenue} tone="in" /></Stat>
      <Stat label="Custo por contato">{s.costPerContact === null ? "—" : <Money cents={s.costPerContact} />}</Stat>
      <Stat label="Custo por cliente">{s.costPerClient === null ? "—" : <Money cents={s.costPerClient} />}</Stat>
      <Stat label="De cada 100 contatos, fecham">{s.conversion === null ? "—" : formatPercent(s.conversion)}</Stat>
      <Stat label="Retorno (ROI)" hint="(pagaram − gastou) ÷ gastou">{s.roi === null ? "—" : <span className={s.roi >= 0 ? "text-success" : "text-destructive"}>{formatPercent(s.roi)}</span>}</Stat>
    </div>
  );
}
