"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/forms/password-input";
import { FormMessage } from "@/components/forms/form-message";
import { updatePassword } from "@/features/auth/actions";

/** Formulário de nova senha (usado na recuperação e em Configurações). */
export function NewPasswordForm({ onSuccess, submitLabel = "Salvar nova senha" }: { onSuccess?: () => void; submitLabel?: string }) {
  const { state, pending, onSubmit } = useFormAction(updatePassword);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Senha alterada.");
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-5" noValidate>
      {state.status === "error" && <FormMessage state={state} />}
      <Field id="password" label="Nova senha" hint="Pelo menos 8 caracteres, com letras e números." error={fe.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required aria-invalid={!!fe.password || undefined} />
      </Field>
      <Field id="confirm" label="Repita a nova senha" error={fe.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required aria-invalid={!!fe.confirm || undefined} />
      </Field>
      <Button type="submit" loading={pending} className="w-full sm:w-fit">
        {!pending && <KeyRound />}
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
