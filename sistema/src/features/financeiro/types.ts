import type { Cents } from "@/lib/money";

export type TxKind = "receita" | "despesa" | "transferencia";
export type TxStatus = "pendente" | "efetivado" | "cancelado";

export type TxRow = {
  id: string;
  kind: TxKind;
  status: TxStatus;
  description: string;
  amount: Cents;
  competenceDate: string;
  dueDate: string | null;
  settledDate: string | null;
  /** Data que organiza a lista: quando foi pago/recebido, ou o vencimento/fato se ainda pendente. */
  date: string;
  accountId: string | null;
  accountName: string | null;
  toAccountId: string | null;
  toAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  customerId: string | null;
  supplier: string | null;
  notes: string | null;
  createdBy: string;
};

export type AccountRow = { id: string; name: string; type: string; balance: Cents; active: boolean };
export type Option = { id: string; name: string };
export type Lookups = {
  accounts: AccountRow[];
  revenueCategories: Option[];
  expenseCategories: Option[];
  paymentMethods: Option[];
  customers: Option[];
};

export type Position = { available: Cents; reserved: Cents; free: Cents; receivable: Cents; payable: Cents };

export type FundRow = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: Cents | null;
  targetDate: string | null;
  balance: Cents;
  targetPercent: number | null;
  active: boolean;
};

export type FundMovementRow = { id: string; fundId: string; kind: "deposito" | "retirada"; amount: Cents; date: string; notes: string | null; createdBy: string };
