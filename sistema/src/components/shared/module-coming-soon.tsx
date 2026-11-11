import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/components/layout/navigation";

/**
 * Tela de uma parte do sistema que ainda não foi liberada. Simples e honesta:
 * sem botões falsos nem dados de exemplo.
 */
export function ModuleComingSoon({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-2 py-10 text-center">
      <span className="flex size-20 items-center justify-center rounded-3xl bg-info-soft text-info">
        <Icon className="size-10" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold">{item.label}</h1>
      <span className="mt-2 rounded-full bg-highlight/25 px-3 py-1 text-sm font-semibold text-brand-navy dark:text-brand-yellow">
        Em breve
      </span>
      <p className="mt-4 text-base text-muted-foreground">{item.description}</p>
      <p className="mt-1 text-sm text-muted-foreground">Esta parte ainda está sendo preparada.</p>
      <Button asChild size="lg" variant="outline" className="mt-8 w-full sm:w-auto">
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  );
}
