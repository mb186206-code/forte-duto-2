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
          autoComplete="username"
          autoFocus
          required
          placeholder="Ex.: Daniel"
          autoCapitalize="words"
          className="h-12 text-lg"
          aria-invalid={!!fe.name || undefined}
        />
      </Field>
      {askCode && (
        <Field id="password" label="Sua senha" hint="Só precisa digitar uma vez neste celular." error={fe.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••"
            className="h-12 text-lg"
            aria-invalid={!!fe.password || undefined}
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
