import { z } from "zod";
import { parseBRL } from "@/lib/money";
import { isTime } from "@/lib/dates";
import { dateField, moneyField, optionalDate, optionalId, optionalText } from "./financeiro";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Valor em reais opcional (vazio = nenhum). Aceita zero. */
const optionalMoney = (msg = "Valor inválido. Exemplo: 150,00") =>
  z.preprocess(emptyToUndef, z.string().optional()).transform((s, ctx) => {
    if (s === undefined) return null;
    const c = parseBRL(s);
    if (c === null || c < 0) {
      ctx.addIssue({ code: "custom", message: msg });
      return z.NEVER;
    }
    return c;
  });

/** Quantidade com até 3 casas ("2", "1,5"). */
const quantityField = z
  .string({ error: "Digite a quantidade." })
  .transform((s, ctx) => {
    const n = Number(s.trim().replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "Quantidade inválida. Exemplo: 2" });
      return z.NEVER;
    }
    return Math.round(n * 1000) / 1000;
  });

export const CUSTOMER_STATUS = ["novo_contato", "em_atendimento", "cliente", "inativo"] as const;
export const SERVICE_STATUS = ["solicitado", "agendado", "em_andamento", "aguardando_material", "concluido", "cancelado"] as const;
export const BUDGET_STATUS = ["aguardando", "aprovado", "recusado", "expirado"] as const;
export const ITEM_KIND = ["material", "mao_de_obra", "outro"] as const;

export const customerSchema = z.object({
  id: optionalId,
  name: z.string({ error: "Qual o nome do cliente?" }).trim().min(1, "Qual o nome do cliente?").max(120, "Nome muito longo."),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  address: optionalText(300),
  requestedService: optionalText(200),
  estimatedValue: optionalMoney(),
  sourceId: optionalId,
  status: z.enum(CUSTOMER_STATUS).default("novo_contato"),
  notes: optionalText(2000),
});

export const serviceSchema = z.object({
  id: optionalId,
  customerId: z.uuid("Escolha o cliente."),
  serviceTypeId: optionalId,
  description: optionalText(2000),
  address: optionalText(300),
  responsibleName: optionalText(120),
  scheduledDate: optionalDate,
  scheduledTime: z.preprocess(emptyToUndef, z.string().refine(isTime, "Hora inválida. Exemplo: 14:30").optional()),
  contractValue: optionalMoney(),
  status: z.enum(SERVICE_STATUS).default("solicitado"),
  notes: optionalText(2000),
});

export const serviceStatusSchema = z.object({ id: z.uuid(), status: z.enum(SERVICE_STATUS) });

export const costItemSchema = z.object({
  serviceId: z.uuid(),
  kind: z.enum(ITEM_KIND),
  description: z.string({ error: "Do que se trata o custo?" }).trim().min(1, "Do que se trata o custo?").max(200, "Texto muito longo."),
  quantity: quantityField,
  unitCost: moneyField("o valor"),
});

export const servicePaymentSchema = z
  .object({
    serviceId: z.uuid(),
    amount: moneyField(),
    done: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    date: dateField(),
    accountId: optionalId,
    paymentMethodId: optionalId,
  })
  .refine((v) => !(v.done && !v.accountId), { path: ["accountId"], message: "Em que conta o dinheiro entrou?", when: () => true });

export const budgetSchema = z
  .object({
    id: optionalId,
    customerId: z.uuid("Escolha o cliente."),
    serviceTypeId: optionalId,
    description: optionalText(2000),
    address: optionalText(300),
    issueDate: dateField(),
    validUntil: optionalDate,
    discount: optionalMoney("Desconto inválido. Exemplo: 50,00"),
    notes: optionalText(2000),
  })
  .refine((v) => !v.validUntil || v.validUntil >= v.issueDate, { path: ["validUntil"], message: "A validade não pode ser antes da data do orçamento.", when: () => true });

export const budgetItemSchema = z.object({
  budgetId: z.uuid(),
  kind: z.enum(ITEM_KIND),
  description: z.string({ error: "O que está sendo cobrado?" }).trim().min(1, "O que está sendo cobrado?").max(200, "Texto muito longo."),
  quantity: quantityField,
  unitPrice: moneyField("o valor"),
});

export const budgetStatusSchema = z.object({ id: z.uuid(), status: z.enum(BUDGET_STATUS) });
