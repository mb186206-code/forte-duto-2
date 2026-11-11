"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-destructive">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Algo deu errado ao carregar esta tela</h1>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Nenhum dado foi perdido. Verifique sua internet e tente de novo. Se continuar, avise o administrador
        {error.digest ? ` informando o código ${error.digest}` : ""}.
      </p>
      <Button className="mt-6" onClick={reset}>
        <RotateCcw /> Tentar de novo
      </Button>
    </div>
  );
}
