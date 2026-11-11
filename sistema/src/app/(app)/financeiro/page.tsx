import type { Metadata } from "next";
import { ModuleComingSoon } from "@/components/shared/module-coming-soon";
import { NAV_ITEMS } from "@/components/layout/navigation";

const item = NAV_ITEMS.find((i) => i.key === "financeiro")!;

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return <ModuleComingSoon item={item} />;
}
