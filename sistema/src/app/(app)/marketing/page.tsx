import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "marketing")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Campanhas de Instagram, Facebook e Google Ads",
  "Investimento, alcance, cliques, conversas e contatos",
  "Custo por contato, custo por cliente e retorno (ROI)",
  "Links com UTM para rastrear de onde vem cada contato",
  "Separação entre origem declarada, rastreada e desconhecida",
  "Estrutura pronta para integrar Meta Ads, Google Ads e WhatsApp Business",
];

export default async function Page() {
  await requireModule("marketing");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
