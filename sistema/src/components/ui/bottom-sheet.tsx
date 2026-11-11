"use client";

import * as React from "react";
import { Dialog as P } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Painel que sobe de baixo no celular (e vira janela no computador).
 * É onde ficam os formulários: a pessoa não sai da lista.
 */
function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      <P.Portal>
        <P.Overlay className="fixed inset-0 z-50 bg-[#0b1421]/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <P.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border bg-card shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300",
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[88dvh] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0">
              <P.Title className="text-lg font-bold">{title}</P.Title>
              {description ? (
                <P.Description className="mt-0.5 text-sm text-muted-foreground">{description}</P.Description>
              ) : (
                <P.Description className="sr-only">{title}</P.Description>
              )}
            </div>
            <P.Close className="-mt-1 -mr-2 rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
              <X className="size-5" />
              <span className="sr-only">Fechar</span>
            </P.Close>
          </div>
          <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

export { BottomSheet };
