import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-info-soft text-info">
        <Compass className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">O endereço pode estar errado ou a página foi removida.</p>
      <Button asChild>
        <Link href="/dashboard">Ir para o início</Link>
      </Button>
    </main>
  );
}
