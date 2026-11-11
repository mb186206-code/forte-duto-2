import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Database, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { NAV_ITEMS, isAvailable } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";
import { canAccess, ROLE_LABELS } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const PHASES = [
  { n: 1, title: "Base do sistema", text: "Acesso seguro, menu, identidade visual e banco de dados com permissões." },
  { n: 2, title: "Financeiro e fundos", text: "Dashboard com indicadores, contas, entradas, despesas e fundos." },
  { n: 3, title: "Comercial", text: "Clientes, serviços, orçamentos e histórico comercial." },
  { n: 4, title: "Marketing", text: "Campanhas, rastreamento de origem e indicadores de anúncios." },
  { n: 5, title: "Relatórios e configurações", text: "Relatórios, exportação PDF/Excel, usuários e permissões." },
  { n: 6, title: "Testes finais e publicação", text: "Testes completos, ajustes e sistema no ar." },
];

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
  const user = await requireModule("dashboard");
  const supabase = await createClient();

  const { count: teamCount, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  const dbOk = !error;

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const firstName = user.fullName.split(" ")[0];
  const modules = NAV_ITEMS.filter((i) => i.key !== "dashboard" && canAccess(user.role, i.key));

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`${greeting()}, ${firstName}!`}
        description={`Hoje é ${today}. Os indicadores financeiros aparecem aqui a partir da Fase 2.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusCard
          icon={Database}
          label="Banco de dados"
          value={dbOk ? "Conectado" : "Sem conexão"}
          ok={dbOk}
          hint={dbOk ? "Tudo o que for cadastrado fica salvo com segurança." : "Verifique a internet ou a configuração."}
        />
        <StatusCard icon={ShieldCheck} label="Seu acesso" value={ROLE_LABELS[user.role]} ok hint="Define o que você vê no menu." />
        <StatusCard
          icon={Users}
          label="Equipe com acesso"
          value={teamCount === null ? "—" : `${teamCount} ${teamCount === 1 ? "pessoa" : "pessoas"}`}
          ok={dbOk}
          hint="Usuários ativos no sistema."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Etapas de entrega</CardTitle>
            <CardDescription>O sistema é entregue por fases, cada uma testada antes da próxima.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-1">
              {PHASES.map((p) => {
                const done = isAvailable(p.n);
                const next = p.n === PHASES.find((x) => !isAvailable(x.n))?.n;
                return (
                  <li key={p.n} className={cn("flex gap-3 rounded-lg p-2.5", next && "bg-info-soft")}>
                    {done ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Concluída" />
                    ) : (
                      <CircleDashed className={cn("mt-0.5 size-5 shrink-0", next ? "text-info" : "text-muted-foreground/60")} aria-label="Pendente" />
                    )}
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        Fase {p.n}: {p.title}
                        {done && <Badge variant="success">Pronta</Badge>}
                        {next && <Badge variant="info">Próxima</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">{p.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Módulos</CardTitle>
            <CardDescription>Atalhos para as áreas que o seu perfil acessa.</CardDescription>
          </CardHeader>
          <CardContent className="grid min-w-0 grid-cols-1 gap-2">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.key}
                  href={m.href}
                  className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-info/40 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
                    <Icon className="size-[1.1rem]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.description}</span>
                  </span>
                  {isAvailable(m.phase) ? (
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
                  ) : (
                    <Badge variant="outline">Fase {m.phase}</Badge>
                  )}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  hint,
  ok,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  hint: string;
  ok: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", ok ? "bg-success-soft text-success" : "bg-danger-soft text-destructive")}>
          <Icon className="size-[1.1rem]" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
