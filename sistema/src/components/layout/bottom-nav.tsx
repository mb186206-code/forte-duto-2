"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as P } from "radix-ui";
import { Menu, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_TABS } from "./navigation";
import { QuickActionList } from "./quick-action-list";
import { MobileNav } from "./mobile-nav";

/** Barra inferior do celular: 3 abas, botão "+" no meio e "Menu". */
export function BottomNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [plusOpen, setPlusOpen] = useState(false);
  const tabs = MOBILE_TABS;

  const tab = (t: (typeof tabs)[number]) => {
    const active = pathname === t.href || pathname.startsWith(t.href + "/");
    const Icon = t.icon;
    return (
      <Link
        key={t.key}
        href={t.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 text-[0.72rem] font-semibold transition-colors",
          active ? "text-brand-navy dark:text-brand-yellow" : "text-muted-foreground",
        )}
      >
        <span className={cn("flex h-8 w-14 items-center justify-center rounded-full transition-colors", active && "bg-highlight/25")}>
          <Icon className="size-[1.4rem]" strokeWidth={active ? 2.4 : 2} aria-hidden />
        </span>
        {t.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-stretch px-1">
        {tabs.slice(0, 2).map(tab)}

        <P.Root open={plusOpen} onOpenChange={setPlusOpen}>
          <div className="flex flex-1 items-start justify-center">
            <P.Trigger
              aria-label="Adicionar"
              className="-mt-5 flex size-16 items-center justify-center rounded-full bg-highlight text-highlight-foreground shadow-lg ring-4 ring-background transition active:scale-95 focus-visible:outline-none focus-visible:ring-ring/40"
            >
              <Plus className="size-8" strokeWidth={2.75} />
            </P.Trigger>
          </div>
          <P.Portal>
            <P.Overlay className="fixed inset-0 z-50 bg-[#0b1421]/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <P.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
              <div className="mb-4 flex items-center justify-between">
                <P.Title className="text-lg font-bold">O que você quer fazer?</P.Title>
                <P.Close className="rounded-full p-2 text-muted-foreground hover:bg-accent" aria-label="Fechar">
                  <X className="size-5" />
                </P.Close>
              </div>
              <P.Description className="sr-only">Ações rápidas</P.Description>
              <QuickActionList onSelect={() => setPlusOpen(false)} />
            </P.Content>
          </P.Portal>
        </P.Root>

        {tabs.slice(2).map(tab)}

        <MobileNav
          userName={userName}
          trigger={
            <button type="button" className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.72rem] font-semibold text-muted-foreground">
              <span className="flex h-8 w-14 items-center justify-center rounded-full">
                <Menu className="size-[1.4rem]" aria-hidden />
              </span>
              Menu
            </button>
          }
        />
      </div>
    </nav>
  );
}
