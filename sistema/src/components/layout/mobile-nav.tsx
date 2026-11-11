"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/lib/auth/permissions";
import { SidebarBody } from "./app-sidebar";

/** Menu completo no celular: abre o mesmo menu lateral como gaveta. */
export function MobileNav({ role, trigger }: { role: Role; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="text-sidebar-foreground-strong">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Todas as áreas do sistema</SheetDescription>
        <SidebarBody role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
