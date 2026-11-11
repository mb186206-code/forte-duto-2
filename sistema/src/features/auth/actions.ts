"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/routes";
import { getSiteUrl } from "@/lib/site-url";
import { fieldErrors, newPasswordSchema, resetRequestSchema, signInSchema } from "@/lib/validation/auth";
import type { FormState } from "@/lib/form-state";

function authErrorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos. Confira e tente de novo.";
    case "email_not_confirmed":
      return "Este e-mail ainda não foi confirmado. Procure o convite na sua caixa de entrada.";
    case "user_banned":
      return "Este acesso está bloqueado. Fale com o administrador.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
    case "same_password":
      return "A nova senha precisa ser diferente da atual.";
    case "weak_password":
      return "Senha fraca. Use pelo menos 8 caracteres, com letras e números.";
    case "session_not_found":
    case "session_expired":
      return "Sua sessão expirou. Peça um novo link de recuperação.";
    default:
      return fallback;
  }
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return {
      status: "error",
      message: authErrorMessage(error.code, "Não foi possível entrar agora. Tente novamente em instantes."),
    };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(parsed.data.next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?motivo=saiu");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/redefinir-senha`,
  });

  // Por segurança, a resposta é a mesma exista ou não o e-mail cadastrado.
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
    return { status: "error", message: authErrorMessage(error.code, "") };
  }
  return {
    status: "success",
    message: "Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { status: "error", message: "Sua sessão expirou. Entre novamente ou peça um novo link de recuperação." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: authErrorMessage(error.code, "Não foi possível alterar a senha. Tente novamente.") };
  }
  return { status: "success", message: "Senha alterada com sucesso." };
}
