import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "fundos")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Reserva de emergência, equipamentos, expansão, manutenção e investimento",
  "Meta de cada fundo com percentual alcançado",
  "Depósitos e retiradas com histórico",
  "Gráfico de progresso das metas",
  "Dinheiro livre = saldo disponível menos reservas",
  "Depositar num fundo não é despesa",
];

export default async function Page() {
  await requireModule("fundos");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
