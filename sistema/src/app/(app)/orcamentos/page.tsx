import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { todayISO } from "@/lib/dates";
import { getCommercialLookups, listBudgets } from "@/features/comercial/queries";
import { OrcamentosView } from "@/features/comercial/components/orcamentos-view";

export const metadata: Metadata = { title: "Orçamentos" };
export const dynamic = "force-dynamic";

export default async function OrcamentosPage({ searchParams }: { searchParams: Promise<{ novo?: string; cliente?: string }> }) {
  const sp = await searchParams;
  const [rows, lookups] = await Promise.all([listBudgets(), getCommercialLookups()]);
  const customerId = lookups.customers.some((c) => c.id === sp.cliente) ? sp.cliente : undefined;
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <PageHeader title="Orçamentos" description="Propostas para os clientes. Aprovou? Transforme em serviço com um toque." />
      <OrcamentosView rows={rows} lookups={lookups} today={todayISO()} openNew={sp.novo === "1"} customerId={customerId} />
    </div>
  );
}
