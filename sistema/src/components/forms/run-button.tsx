"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Result = { status: string; message?: string };

/**
 * Botão que executa uma ação do servidor (mudar situação, apagar...) e avisa o resultado.
 * Com `confirm`, pede um "tem certeza?" antes (ação que não dá para desfazer).
 */
export function RunButton({
  run,
  children,
  confirm,
  variant = "outline",
  size = "lg",
  className,
  onDone,
}: {
  run: () => Promise<Result | void>;
  children: React.ReactNode;
  confirm?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);

  function go() {
    start(async () => {
      const r = await run();
      if (r && r.status === "error") {
        toast.error(r.message ?? "Não foi possível concluir.");
        return;
      }
      if (r?.message) toast.success(r.message);
      setAsking(false);
      onDone?.();
    });
  }

  if (confirm && asking) {
    return (
      <div className="grid gap-2 rounded-xl border border-destructive/30 bg-danger-soft p-3">
        <p className="text-sm font-medium">{confirm}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setAsking(false)} disabled={pending}>
            Não
          </Button>
          <Button variant="destructive" onClick={go} loading={pending}>
            Sim
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Button variant={variant} size={size} className={className} onClick={confirm ? () => setAsking(true) : go} loading={!confirm && pending}>
      {children}
    </Button>
  );
}
