"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { leaveDevice } from "@/features/access/actions";

export function LeaveButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full text-destructive sm:w-fit">
          <LogOut /> Sair deste celular
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sair deste celular?</DialogTitle>
          <DialogDescription>Para entrar de novo, vai ser preciso digitar o código da empresa.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" size="lg" loading={pending} onClick={() => start(() => leaveDevice())}>
            Sair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
