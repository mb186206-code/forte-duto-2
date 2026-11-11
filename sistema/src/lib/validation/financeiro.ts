import { z } from "zod";
import { parseBRL } from "@/lib/money";
import { isISODate } from "@/lib/dates";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const optionalId = z.preprocess(emptyToUndef, z.uuid("Escolha uma opção da lista.").optional());
export const optionalText = (max: number) => z.preprocess(emptyToUndef, z.string().trim().max(max, `Máximo de ${max} letras.`).optional());

/** Valor digitado em reais → centavos (inteiro > 0). */
export const moneyField = (label = "o valor") =>
  z
    .string({ error: `Digite ${label}.` })
    .transform((s, ctx) => {
      const cents = parseBRL(s);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Valor inválido. Exemplo: 150,00" });
        return z.NEVER;
      }
      if (cents <= 0) {
        ctx.addIssue({ code: "custom", message: "O valor precisa ser maior que zero." });
        return z.NEVER;
      }
      return cents;
    });

export const dateField = (message = "Escolha uma data válida.") =>
  z.string({ error: message }).refine(isISODate, message);

export const optionalDate = z.preprocess(emptyToUndef, z.string().refine(isISODate, "Escolha uma data válida.").optional());

export const transactionSchema = z
  .object({
    id: optionalId,
    kind: z.enum(["receita", "despesa"]),
    description: z.string({ error: "Escreva do que se trata." }).trim().min(1, "Escreva do que se trata.").max(200, "Texto muito longo."),
    amount: moneyField(),
    done: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    date: dateField(),
    accountId: optionalId,
    categoryId: optionalId,
    paymentMethodId: optionalId,
    customerId: optionalId,
    supplier: optionalText(120),
    notes: optionalText(2000),
  })
  .refine((v) => !(v.done && !v.accountId), {
    path: ["accountId"],
    error: (iss) => ((iss.input as { kind?: string } | undefined)?.kind === "receita" ? "Em que conta o dinheiro entrou?" : "De qual conta saiu o dinheiro?"),
    // roda mesmo com outro campo inválido, para mostrar todos os erros de uma vez
    when: () => true,
  });

export const settleSchema = z.object({
  id: z.uuid(),
  accountId: z.uuid("Escolha a conta."),
  date: dateField(),
});

export const accountSchema = z.object({
  id: optionalId,
  name: z.string({ error: "Dê um nome para a conta." }).trim().min(1, "Dê um nome para a conta.").max(80, "Nome muito longo."),
  type: z.enum(["banco", "caixa", "carteira_digital", "outro"]),
  openingBalance: z.preprocess(emptyToUndef, z.string().optional()).transform((s, ctx) => {
    if (s === undefined) return 0;
    const c = parseBRL(s);
    if (c === null || c < 0) {
      ctx.addIssue({ code: "custom", message: "Valor inválido. Exemplo: 1500,00" });
      return z.NEVER;
    }
    return c;
  }),
});

export const transferSchema = z
  .object({
    fromId: z.uuid("Escolha a conta de onde sai."),
    toId: z.uuid("Escolha a conta para onde vai."),
    amount: moneyField(),
    date: dateField(),
    notes: optionalText(500),
  })
  .refine((v) => v.fromId !== v.toId, { path: ["toId"], message: "Escolha duas contas diferentes." });

export const fundSchema = z.object({
  name: z.string({ error: "Dê um nome para o fundo." }).trim().min(1, "Dê um nome para o fundo.").max(80, "Nome muito longo."),
  description: optionalText(500),
  target: z.preprocess(emptyToUndef, z.string().optional()).transform((s, ctx) => {
    if (s === undefined) return null;
    const c = parseBRL(s);
    if (c === null || c <= 0) {
      ctx.addIssue({ code: "custom", message: "Meta inválida. Exemplo: 10000,00" });
      return z.NEVER;
    }
    return c;
  }),
});

export const fundMovementSchema = z.object({
  fundId: z.uuid(),
  kind: z.enum(["deposito", "retirada"]),
  amount: moneyField(),
  date: dateField(),
  notes: optionalText(500),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Texto e campos do formulário → objeto simples para o Zod (campos vazios viram undefined onde couber). */
export function formToObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}
