"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/auth/permissions";
import { QUICK_ACTIONS, isAvailable } from "./navigation";

/**
 * Botões de ação rápida. Ações de módulos ainda não entregues aparecem
 * desativadas com a fase prevista — nunca como botão que não faz nada.
 */
export function QuickActions({ role }: { role: Role }) {
  const actions = QUICK_ACTIONS.filter((a) => a.roles.includes(role));
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="highlight" className="gap-1.5 px-3 sm:px-4">
          <Plus className="size-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Novo</span>
          <span className="sr-only sm:hidden">Ações rápidas</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
        {actions.map((action) => {
          const Icon = action.icon;
          const available = isAvailable(action.phase);
          return available ? (
            <DropdownMenuItem key={action.key} asChild>
              <Link href={action.href}>
                <Icon />
                {action.label}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={action.key} disabled>
              <Icon />
              <span className="flex-1">{action.label}</span>
              <span className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">Fase {action.phase}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
