"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { initialFormState, type FormState } from "@/lib/form-state";

/**
 * Liga um formulário a uma Server Action SEM limpar os campos quando a
 * validação falha (o reset automático do React apagaria o que a pessoa digitou).
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, initialFormState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit };
}
