import { z } from "zod";

export const emailSchema = z
  .string({ error: "Informe seu e-mail." })
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(160, "E-mail muito longo.")
  .pipe(z.email({ error: "E-mail inválido. Confira se digitou certo." }))
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string({ error: "Informe a senha." })
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.")
  .refine((v) => /[A-Za-zÀ-ÿ]/.test(v) && /\d/.test(v), "Use letras e números na senha.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
  next: z.string().optional(),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não são iguais." });

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
  phone: z
    .string()
    .trim()
    .max(30, "Telefone muito longo.")
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 10, "Telefone incompleto. Use DDD + número.")
    .transform((v) => (v === "" ? null : v)),
});

/** Primeira mensagem de erro de cada campo, pronta para o formulário. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
