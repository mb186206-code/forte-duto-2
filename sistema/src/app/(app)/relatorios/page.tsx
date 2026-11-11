import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireModule } from "@/lib/auth/session";

const item = NAV_ITEMS.find((i) => i.key === "relatorios")!;

export const metadata: Metadata = { title: item.label };

export default async function Page() {
  await requireModule("relatorios");
  return <ModuleComingSoon item={item} />;
}
