import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "financeiro")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Lançar entradas com cliente, categoria, conta e forma de pagamento",
  "Lançar despesas com fornecedor, vencimento e comprovante",
  "Cadastrar contas (banco, caixa, carteira digital) com saldo inicial",
  "Transferir entre contas sem contar como receita ou despesa",
  "Ver contas a receber e a pagar, com alertas de vencimento",
  "Histórico com busca, filtros, paginação e edição",
];

export default async function Page() {
  await requireModule("financeiro");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
