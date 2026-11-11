import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "relatorios")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Faturamento, despesas e resultado operacional",
  "Fluxo de caixa e evolução mensal",
  "Serviços mais contratados e clientes por origem",
  "Resultado das campanhas e valores pendentes",
  "Filtro por período",
  "Exportar PDF e Excel, e imprimir",
];

export default async function Page() {
  await requireModule("relatorios");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
