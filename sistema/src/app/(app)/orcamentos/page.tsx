import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "orcamentos")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Número automático para cada orçamento",
  "Itens de materiais e mão de obra com total calculado",
  "Validade e situação: aguardando, aprovado, recusado, expirado",
  "Transformar orçamento aprovado em serviço com um clique",
  "Orçamento aprovado nunca conta como dinheiro recebido",
  "Histórico de orçamentos por cliente",
];

export default async function Page() {
  await requireModule("orcamentos");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
