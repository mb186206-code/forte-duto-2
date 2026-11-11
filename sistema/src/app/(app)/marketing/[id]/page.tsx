import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { formatDateBR, todayISO } from "@/lib/dates";
import { PLATFORM_LABEL } from "@/lib/utm";
import { getCommercialLookups } from "@/features/comercial/queries";
import { getCampaign, listAds, listCampaignContacts, listMetrics } from "@/features/marketing/queries";
import { ATTRIBUTION_SHORT, CAMPAIGN_STATUS_LABEL } from "@/features/marketing/types";
import { CampaignDetail } from "@/features/marketing/components/campaign-detail";
import { StatGrid } from "@/features/marketing/components/stat-grid";

export const metadata: Metadata = { title: "Campanha" };
export const dynamic = "force-dynamic";

export default async function CampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const campaign = await getCampaign(id);
  if (!campaign) notFound();
  const [ads, metrics, contacts, lookups] = await Promise.all([listAds(id), listMetrics(id), listCampaignContacts(id), getCommercialLookups()]);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <Link href="/marketing" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Marketing
      </Link>

      <Card className="grid gap-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <Badge variant={campaign.status === "ativa" ? "success" : campaign.status === "pausada" ? "warning" : "outline"}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {PLATFORM_LABEL[campaign.platform]}
          {campaign.serviceTypeName ? ` · ${campaign.serviceTypeName}` : ""}
          {campaign.startDate ? ` · de ${formatDateBR(campaign.startDate)}` : ""}
          {campaign.endDate ? ` até ${formatDateBR(campaign.endDate)}` : ""}
        </p>
        {campaign.plannedBudget != null && (
          <p className="text-sm">
            Pretende gastar <Money cents={campaign.plannedBudget} /> · já gastou <Money cents={campaign.stats.spend} />
          </p>
        )}
        {campaign.notes && <p className="mt-1 whitespace-pre-line rounded-lg bg-secondary/60 p-3 text-sm">{campaign.notes}</p>}
      </Card>

      <StatGrid s={campaign.stats} />

      <Card className="p-4">
        <h2 className="font-semibold">Pessoas ligadas a esta campanha</h2>
        {contacts.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Ninguém ainda. Abra a ficha de um cliente e, em “Como chegou”, escolha esta campanha.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {contacts.map((c) => (
              <li key={c.customerId + c.date}>
                <Link href={`/clientes/${c.customerId}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {ATTRIBUTION_SHORT[c.type]} · {formatDateBR(c.date)}
                      {c.adName ? ` · ${c.adName}` : ""}
                    </span>
                  </span>
                  {c.revenue > 0 ? <Money cents={c.revenue} tone="in" className="text-sm font-semibold" /> : <span className="text-xs text-muted-foreground">Ainda não pagou</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CampaignDetail campaign={campaign} ads={ads} metrics={metrics} serviceTypes={lookups.serviceTypes} today={todayISO()} />
    </div>
  );
}
