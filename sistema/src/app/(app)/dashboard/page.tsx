import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { QuickActionList } from "@/components/layout/quick-action-list";
import { requireModule } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Início" };

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
  const firstName = user.fullName.split(" ")[0];
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const seesMoney = user.role === "admin" || user.role === "financeiro";

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">{today}</p>
        <h1 className="mt-0.5 text-[1.75rem] leading-tight font-bold tracking-tight">
          {greeting()}, {firstName}!
        </h1>
      </div>

      <section aria-labelledby="acoes" className="grid gap-3">
        <h2 id="acoes" className="text-base font-semibold">
          O que você quer fazer?
        </h2>
        <QuickActionList role={user.role} />
      </section>

      <Card className="flex items-start gap-4 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-highlight/25 text-brand-navy dark:text-brand-yellow">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">{seesMoney ? "Seu resumo do mês vai aparecer aqui" : "Seus serviços do dia vão aparecer aqui"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {seesMoney
              ? "Quanto entrou, quanto saiu e quanto sobrou, assim que os lançamentos de dinheiro forem liberados."
              : "Os atendimentos agendados para hoje, assim que a parte de serviços for liberada."}
          </p>
        </div>
      </Card>
    </div>
  );
}
