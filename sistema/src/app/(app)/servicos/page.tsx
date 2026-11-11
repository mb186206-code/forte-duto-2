import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "servicos")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Serviços com cliente, endereço, responsável e valores",
  "Situação: solicitado, agendado, em andamento, aguardando material, concluído, cancelado",
  "Calendário de agendamentos e visualização em cartões",
  "Custos de materiais e mão de obra com margem calculada",
  "Fotos de antes e depois",
  "Registrar o pagamento recebido do serviço",
];

export default async function Page() {
  await requireModule("servicos");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
