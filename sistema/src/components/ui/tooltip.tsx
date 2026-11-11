"use client";

import * as React from "react";
import { Tooltip as P } from "radix-ui";
import { cn } from "@/lib/utils";

const TooltipProvider = P.Provider;
const Tooltip = P.Root;
const TooltipTrigger = P.Trigger;

function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-64 rounded-md bg-[#0f1b2d] px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
