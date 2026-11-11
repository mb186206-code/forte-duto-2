import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Campo de valor em reais: teclado numérico no celular, aceita "1.234,56". */
export function MoneyInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type" | "inputMode">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base font-semibold text-muted-foreground">R$</span>
      <Input inputMode="decimal" autoComplete="off" placeholder="0,00" className={cn("pl-10 text-lg font-semibold", className)} {...props} />
    </div>
  );
}
