import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateBR, todayISO } from "@/lib/dates";
import { getBudget, getCommercialLookups, listBudgetItems } from "@/features/comercial/queries";
import { BudgetDetail } from "@/features/comercial/components/budget-detail";
import { budgetBadge, effectiveBudgetStatus } from "@/features/comercial/status";
import { BUDGET_STATUS_LABEL } from "@/features/comercial/types";

export const metadata: Metadata = { title: "Orçamento" };
export const dynamic = "force-dynamic";

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const budget = await getBudget(id);
  if (!budget) notFound();
  const [items, lookups] = await Promise.all([listBudgetItems(id), getCommercialLookups()]);
  const today = todayISO();
  const status = effectiveBudgetStatus(budget, today);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <Link href="/orcamentos" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground print:hidden" data-no-print>
        <ChevronLeft className="size-4" /> Orçamentos
      </Link>

      <Card className="grid gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">Forte Duto · Orçamento nº {budget.number}</p>
            <h1 className="text-2xl font-bold">{budget.typeName ?? "Orçamento"}</h1>
            <Link href={`/clientes/${budget.customerId}`} className="font-medium text-info hover:underline">
              {budget.customerName}
            </Link>
          </div>
          <Badge variant={budgetBadge(status)}>{BUDGET_STATUS_LABEL[status]}</Badge>
        </div>
        {budget.description && <p className="whitespace-pre-line">{budget.description}</p>}
        {budget.address && (
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" aria-hidden /> {budget.address}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Feito em {formatDateBR(budget.issueDate)}
          {budget.validUntil ? ` · vale até ${formatDateBR(budget.validUntil)}` : ""}
        </p>
        {budget.notes && <p className="whitespace-pre-line rounded-lg bg-secondary/60 p-3 text-sm">{budget.notes}</p>}
      </Card>

      <BudgetDetail budget={budget} items={items} lookups={lookups} today={today} status={status} />
    </div>
  );
}
