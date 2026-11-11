"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enter } from "@/features/access/actions";

export function EntryForm({ askCode }: { askCode: boolean }) {
  const { state, pending, onSubmit } = useFormAction(enter);
  const fe = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <Field id="name" label="Seu nome" error={fe.name}>
        <Input
          id="name"
          name="name"
          autoComplete="given-name"
          autoFocus
          required
          placeholder="Ex.: Daniel"
          className="h-12 text-lg"
          aria-invalid={!!fe.name || undefined}
        />
      </Field>
      {askCode && (
        <Field id="code" label="Código da empresa" hint="Só precisa digitar uma vez neste celular." error={fe.code}>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="••••••"
            className="h-12 text-center text-2xl tracking-[0.5em]"
            aria-invalid={!!fe.code || undefined}
          />
        </Field>
      )}
      <Button type="submit" size="lg" loading={pending} className="h-13 text-base">
        {pending ? "Entrando…" : "Entrar"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  );
}
