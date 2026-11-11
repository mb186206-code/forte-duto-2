import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { todayISO } from "@/lib/dates";
import { getCommercialLookups, listServices } from "@/features/comercial/queries";
import { ServicosView } from "@/features/comercial/components/servicos-view";

export const metadata: Metadata = { title: "Serviços" };
export const dynamic = "force-dynamic";

export default async function ServicosPage({ searchParams }: { searchParams: Promise<{ novo?: string; cliente?: string }> }) {
  const sp = await searchParams;
  const [rows, lookups] = await Promise.all([listServices(), getCommercialLookups()]);
  const customerId = lookups.customers.some((c) => c.id === sp.cliente) ? sp.cliente : undefined;
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <PageHeader title="Serviços" description="Os atendimentos do dia e dos próximos dias. Toque num serviço para ver os detalhes." />
      <ServicosView rows={rows} lookups={lookups} today={todayISO()} openNew={sp.novo === "1"} customerId={customerId} />
    </div>
  );
}
