import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { todayISO } from "@/lib/dates";
import { getFundMovements, getFunds, getPosition } from "@/features/financeiro/queries";
import { PositionCards } from "@/features/financeiro/components/position-cards";
import { FundosView } from "@/features/fundos/components/fundos-view";

export const metadata: Metadata = { title: "Fundos da empresa" };
export const dynamic = "force-dynamic";

export default async function FundosPage() {
  const [funds, movements, position] = await Promise.all([getFunds(), getFundMovements(), getPosition()]);
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <PageHeader title="Fundos da empresa" description="Separe dinheiro para planos e emergências. O dinheiro guardado sai do “livre para usar”, mas continua nas suas contas." />
      <PositionCards position={position} />
      <FundosView funds={funds} movements={movements} today={todayISO()} />
    </div>
  );
}
