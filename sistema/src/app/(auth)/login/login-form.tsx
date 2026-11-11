"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/forms/password-input";
import { FormMessage } from "@/components/forms/form-message";
import { signIn } from "@/features/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useFormAction(signIn);
  const fe = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage state={state} />
      <Field id="email" label="E-mail" error={fe.email}>
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
          aria-describedby={fe.email ? "email-error" : undefined}
        />
      </Field>
      <Field id="password" label="Senha" error={fe.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={!!fe.password || undefined}
          aria-describedby={fe.password ? "password-error" : undefined}
        />
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-medium text-info hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" size="lg" loading={pending}>
        {!pending && <LogIn />}
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
