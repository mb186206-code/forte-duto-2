import { z } from "zod";
import { parseBRL } from "@/lib/money";
import { optionalText } from "./financeiro";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const goal = (msg: string) =>
  z.preprocess(emptyToUndef, z.string().optional()).transform((s, ctx) => {
    if (s === undefined) return null;
    const c = parseBRL(s);
    if (c === null || c < 0) {
      ctx.addIssue({ code: "custom", message: msg });
      return z.NEVER;
    }
    return c;
  });

export const companySchema = z.object({
  companyName: z.string({ error: "Qual o nome da empresa?" }).trim().min(1, "Qual o nome da empresa?").max(120, "Nome muito longo."),
  legalName: optionalText(160),
  document: optionalText(20),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z.preprocess(emptyToUndef, z.string().trim().max(160, "E-mail muito longo.").regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido. Exemplo: contato@empresa.com.br").optional()),
  address: optionalText(300),
  monthlyRevenueGoal: goal("Meta inválida. Exemplo: 20000,00"),
  monthlyProfitGoal: goal("Meta inválida. Exemplo: 8000,00"),
});

export const LIST_KEYS = ["despesa", "entrada", "pagamento", "servico", "origem"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

export const listItemSchema = z.object({
  list: z.enum(LIST_KEYS),
  id: z.preprocess(emptyToUndef, z.uuid().optional()),
  name: z.string({ error: "Escreva o nome." }).trim().min(1, "Escreva o nome.").max(80, "Nome muito longo."),
  classification: z.preprocess(emptyToUndef, z.enum(["custo_direto", "despesa_operacional", "investimento", "imposto"]).optional()),
  paid: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
