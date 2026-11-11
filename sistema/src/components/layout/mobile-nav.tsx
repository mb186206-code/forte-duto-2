"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/lib/auth/permissions";
import { SidebarBody } from "./app-sidebar";

/** Menu do celular/tablet: abre o mesmo menu lateral como gaveta. */
export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="text-sidebar-foreground-strong">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navegue pelos módulos do sistema</SheetDescription>
        <SidebarBody role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
