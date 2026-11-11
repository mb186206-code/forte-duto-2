import type { Cents } from "@/lib/money";
import type { Option } from "@/features/financeiro/types";

export type CustomerStatus = "novo_contato" | "em_atendimento" | "cliente" | "inativo";
export type ServiceStatus = "solicitado" | "agendado" | "em_andamento" | "aguardando_material" | "concluido" | "cancelado";
export type BudgetStatus = "aguardando" | "aprovado" | "recusado" | "expirado";
export type ItemKind = "material" | "mao_de_obra" | "outro";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  novo_contato: "Novo contato",
  em_atendimento: "Em atendimento",
  cliente: "Cliente",
  inativo: "Inativo",
};
export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  solicitado: "Pedido",
  agendado: "Agendado",
  em_andamento: "Em andamento",
  aguardando_material: "Esperando material",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  aguardando: "Aguardando resposta",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Vencido",
};
export const ITEM_KIND_LABEL: Record<ItemKind, string> = { material: "Material", mao_de_obra: "Mão de obra", outro: "Outro" };

export type CommercialLookups = {
  customers: { id: string; name: string; phone: string | null }[];
  serviceTypes: Option[];
  sources: Option[];
};

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  requestedService: string | null;
  estimatedValue: Cents | null;
  sourceId: string | null;
  sourceName: string | null;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
};

export type ServiceRow = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  serviceTypeId: string | null;
  typeName: string | null;
  description: string | null;
  address: string | null;
  responsibleName: string | null;
  requestedDate: string;
  scheduledAt: string | null;
  completedAt: string | null;
  contractValue: Cents | null;
  status: ServiceStatus;
  notes: string | null;
  totalCost: Cents;
  /** Dinheiro que realmente entrou (receitas efetivadas ligadas a este serviço). */
  received: Cents;
  /** Cobranças combinadas, mas ainda não pagas. */
  toReceive: Cents;
};

export type LineItem = { id: string; kind: ItemKind; description: string; quantity: number; unit: Cents; total: Cents };

export type BudgetRow = {
  id: string;
  number: number;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  serviceTypeId: string | null;
  typeName: string | null;
  description: string | null;
  address: string | null;
  issueDate: string;
  validUntil: string | null;
  discount: Cents;
  status: BudgetStatus;
  serviceId: string | null;
  notes: string | null;
  subtotal: Cents;
  total: Cents;
};

export type PaymentRow = { id: string; description: string; amount: Cents; status: "pendente" | "efetivado" | "cancelado"; date: string; accountName: string | null };

export type AttachmentRow = { id: string; category: string; fileName: string; url: string | null; createdAt: string; createdBy: string };
