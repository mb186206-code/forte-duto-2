"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { useEffect } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/forms/form-message";
import { updateProfile } from "@/features/profile/actions";

export function ProfileForm({ fullName, email, phone }: { fullName: string; email: string; phone: string | null }) {
  const { state, pending, onSubmit } = useFormAction(updateProfile);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") toast.success(state.message ?? "Salvo.");
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      {state.status === "error" && <FormMessage state={state} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="full_name" label="Nome" error={fe.full_name}>
          <Input id="full_name" name="full_name" defaultValue={fullName} autoComplete="name" required aria-invalid={!!fe.full_name || undefined} />
        </Field>
        <Field id="phone" label="Telefone" optional error={fe.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={phone ?? ""}
            autoComplete="tel"
            placeholder="(21) 99999-9999"
            aria-invalid={!!fe.phone || undefined}
          />
        </Field>
      </div>
      <Field id="email" label="E-mail de acesso" hint="Para trocar o e-mail, fale com o administrador.">
        <Input id="email" value={email} readOnly disabled />
      </Field>
      <Button type="submit" loading={pending} className="w-full sm:w-fit">
        {!pending && <Save />}
        {pending ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
