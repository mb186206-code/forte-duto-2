import Link from "next/link";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import type { NavItem } from "@/components/layout/navigation";

/**
 * Tela de um módulo ainda não entregue. Diz com clareza o que vai existir e
 * em qual fase — sem botões falsos nem dados de exemplo.
 */
export function ModuleComingSoon({ item, features }: { item: NavItem; features: string[] }) {
  const Icon = item.icon;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <PageHeader title={item.label} description={item.description} />
      <Card>
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Este módulo chega na Fase {item.phase}</CardTitle>
              <Badge variant="warning">
                <CalendarClock aria-hidden />
                Em desenvolvimento
              </Badge>
            </div>
            <CardDescription>
              O sistema está sendo entregue por etapas, testando cada uma antes de seguir. Nada aqui está simulado: quando
              o módulo for liberado, tudo o que você cadastrar será salvo de verdade.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm font-semibold">O que você vai poder fazer aqui:</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/dashboard">Voltar ao início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
