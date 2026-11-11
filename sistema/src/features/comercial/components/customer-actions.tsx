"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { RunButton } from "@/components/forms/run-button";
import { deleteCustomer } from "../actions";
import { CustomerForm } from "./customer-form";
import type { CommercialLookups, CustomerRow } from "../types";

export function CustomerActions({ customer, lookups }: { customer: CustomerRow; lookups: CommercialLookups }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-2">
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Pencil /> Editar dados
      </Button>
      <RunButton variant="ghost" className="text-destructive hover:text-destructive" confirm="Apagar este cliente? Isso não pode ser desfeito." run={() => deleteCustomer(customer.id)} onDone={() => router.replace("/clientes")}>
        <Trash2 /> Apagar cliente
      </RunButton>
      <BottomSheet open={open} onOpenChange={setOpen} title="Editar cliente">
        {open && (
          <CustomerForm
            customer={customer}
            lookups={lookups}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}
