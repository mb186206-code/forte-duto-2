"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-message";
import { useFormAction } from "@/components/forms/use-form-action";
import type { FormState } from "@/lib/form-state";

type Ctx = { fe: Record<string, string>; pending: boolean };

/**
 * Formulário de painel: valida no servidor, mostra os erros ao lado de cada
 * campo sem apagar o que foi digitado e, quando dá certo, avisa e fecha.
 */
export function ActionForm({
  action,
  onDone,
  submitLabel,
  submittingLabel = "Salvando…",
  submitVariant = "default",
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  onDone: () => void;
  submitLabel: string;
  submittingLabel?: string;
  submitVariant?: "default" | "highlight";
  children: (ctx: Ctx) => React.ReactNode;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const handled = useRef<FormState | null>(null);

  useEffect(() => {
    if (state.status === "success" && handled.current !== state) {
      handled.current = state;
      if (state.message) toast.success(state.message);
      onDone();
    }
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {children({ fe: state.fieldErrors ?? {}, pending })}
      {state.status === "error" && <FormMessage state={state} />}
      <Button type="submit" size="lg" variant={submitVariant} loading={pending} className="h-12 text-base">
        {pending ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
