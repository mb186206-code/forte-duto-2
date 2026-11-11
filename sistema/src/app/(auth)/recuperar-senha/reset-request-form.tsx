"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/forms/form-message";
import { requestPasswordReset } from "@/features/auth/actions";

export function ResetRequestForm() {
  const { state, pending, onSubmit } = useFormAction(requestPasswordReset);
  const fe = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      {state.status !== "success" && (
        <>
          <Field id="email" label="E-mail cadastrado" error={fe.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="seuemail@exemplo.com"
              aria-invalid={!!fe.email || undefined}
            />
          </Field>
          <Button type="submit" size="lg" loading={pending}>
            {!pending && <Send />}
            {pending ? "Enviando…" : "Enviar link"}
          </Button>
        </>
      )}
    </form>
  );
}
