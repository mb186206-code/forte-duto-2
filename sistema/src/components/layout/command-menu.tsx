"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Search, Sun, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS, QUICK_ACTIONS, isAvailable } from "./navigation";

/**
 * Busca global (Ctrl+K / ⌘K). Na Fase 1 encontra telas e ações;
 * a partir das próximas fases também busca clientes, serviços e movimentações.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const modules = NAV_ITEMS;
  const actions = QUICK_ACTIONS.filter((a) => isAvailable(a.phase));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="flex size-11 items-center justify-center rounded-full text-foreground transition hover:bg-accent lg:hidden"
      >
        <Search className="size-[1.35rem]" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground shadow-xs transition hover:border-ring/50 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none lg:flex"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">Buscar no sistema…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.7rem] font-semibold sm:inline">Ctrl K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 [&>button:last-child]:hidden">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <DialogDescription className="sr-only">Encontre telas e ações do sistema</DialogDescription>
          <Command loop>
            <CommandInput placeholder="O que você procura? Ex.: despesa, clientes" />
            <CommandList>
              <CommandEmpty>Nada encontrado. Tente outra palavra.</CommandEmpty>
              <CommandGroup heading="Ir para">
                {modules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem key={item.key} value={`${item.label} ${item.keywords?.join(" ") ?? ""}`} onSelect={() => go(item.href)}>
                      <Icon />
                      <span className="flex-1">{item.label}</span>
                      {!isAvailable(item.phase) && <span className="text-xs text-muted-foreground">Em breve</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {actions.length > 0 && (
                <CommandGroup heading="Ações rápidas">
                  {actions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <CommandItem key={a.key} value={a.label} onSelect={() => go(a.href)}>
                        <Icon />
                        {a.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup heading="Você">
                <CommandItem value="meu nome configurações" onSelect={() => go("/configuracoes")}>
                  <UserRound />
                  Meu nome e configurações
                </CommandItem>
                <CommandItem
                  value="tema claro escuro aparência"
                  onSelect={() => {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark");
                    setOpen(false);
                  }}
                >
                  {resolvedTheme === "dark" ? <Sun /> : <Moon />}
                  {resolvedTheme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
