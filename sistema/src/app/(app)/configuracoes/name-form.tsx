"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { useEffect } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changeName } from "@/features/access/actions";

export function NameForm({ name }: { name: string }) {
  const { state, pending, onSubmit } = useFormAction(changeName);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") toast.success(state.message ?? "Salvo.");
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field id="name" label="Seu nome" hint="Aparece no histórico do que cada um lançou." error={fe.name}>
        <Input id="name" name="name" defaultValue={name} autoComplete="name" required aria-invalid={!!fe.name || undefined} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-fit">
        {!pending && <Save />}
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
