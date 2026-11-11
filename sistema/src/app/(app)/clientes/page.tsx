import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "clientes")!;

export const metadata: Metadata = { title: item.label };

const FEATURES = [
  "Cadastro rápido, mesmo com dados incompletos",
  "Busca por nome e telefone, com aviso de cliente duplicado",
  "Origem do contato e campanha relacionada",
  "Ficha do cliente: serviços, orçamentos, pagamentos e observações",
  "Total de serviços contratados por cliente",
  "Botão direto para chamar no WhatsApp",
];

export default async function Page() {
  await requireModule("clientes");
  return <ModuleComingSoon item={item} features={FEATURES} />;
}
