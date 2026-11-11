import { z } from "zod";

export const entrySchema = z.object({
  name: z.string().trim().min(2, "Digite seu nome.").max(60, "Nome muito longo."),
  password: z.string().max(80).optional(),
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
