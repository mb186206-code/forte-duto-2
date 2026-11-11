"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { QUICK_ACTIONS, isAvailable, type QuickAction } from "./navigation";

const TONE: Record<QuickAction["tone"], string> = {
  in: "bg-success-soft text-success",
  out: "bg-danger-soft text-destructive",
  neutral: "bg-info-soft text-info",
};

/**
 * Botões grandes de ação rápida (celular e início). Ações que ainda não
 * foram liberadas aparecem apagadas com "Em breve", nunca como botão falso.
 */
export function QuickActionList({ onSelect, className }: { onSelect?: () => void; className?: string }) {
  const actions = QUICK_ACTIONS;
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {actions.map((a, i) => {
        const Icon = a.icon;
        const available = isAvailable(a.phase);
        const content = (
          <>
            <span className={cn("flex size-12 items-center justify-center rounded-2xl", TONE[a.tone])}>
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="text-[0.95rem] leading-tight font-semibold text-foreground">{a.label}</span>
            {!available && <span className="text-xs font-medium text-muted-foreground">Em breve</span>}
          </>
        );
        const base = cn(
          "flex min-h-32 flex-col items-start justify-between gap-3 rounded-2xl border bg-card p-4 text-left shadow-[0_1px_2px_rgba(15,27,45,0.04)]",
          // primeira ação ocupa a linha inteira quando o total é ímpar
          actions.length % 2 === 1 && i === actions.length - 1 && "col-span-2 min-h-0 flex-row items-center justify-start",
        );
        return available ? (
          <Link key={a.key} href={a.href} onClick={onSelect} className={cn(base, "transition active:scale-[0.98] hover:border-info/40")}>
            {content}
          </Link>
        ) : (
          <div key={a.key} aria-disabled="true" className={cn(base, "opacity-60")}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
