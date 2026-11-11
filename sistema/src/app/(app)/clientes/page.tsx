import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { getCommercialLookups, listCustomers } from "@/features/comercial/queries";
import { ClientesView } from "@/features/comercial/components/clientes-view";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ novo?: string }> }) {
  const sp = await searchParams;
  const [rows, lookups] = await Promise.all([listCustomers(), getCommercialLookups()]);
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <PageHeader title="Clientes" description="Quem pediu serviço ou orçamento. Toque num cliente para ver tudo dele." />
      <ClientesView rows={rows} lookups={lookups} openNew={sp.novo === "1"} />
    </div>
  );
}
