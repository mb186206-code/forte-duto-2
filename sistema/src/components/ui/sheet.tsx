"use client";

import * as React from "react";
import { Dialog as P } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = P.Root;
const SheetTrigger = P.Trigger;
const SheetClose = P.Close;
const SheetTitle = P.Title;
const SheetDescription = P.Description;

function SheetContent({
  className,
  children,
  side = "left",
  hideClose = false,
  ...props
}: React.ComponentProps<typeof P.Content> & { side?: "left" | "right"; hideClose?: boolean }) {
  return (
    <P.Portal>
      <P.Overlay className="fixed inset-0 z-50 bg-[#0b1421]/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <P.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[86%] max-w-xs flex-col shadow-2xl transition ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
          side === "left"
            ? "left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
            : "right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <P.Close className="absolute top-4 right-3 rounded-md p-1.5 text-current/70 transition hover:bg-white/10 hover:text-current focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
            <X className="size-5" />
            <span className="sr-only">Fechar menu</span>
          </P.Close>
        )}
      </P.Content>
    </P.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
