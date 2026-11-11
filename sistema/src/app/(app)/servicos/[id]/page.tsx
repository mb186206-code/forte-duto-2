import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ChevronLeft, MapPin, MessageCircle, User } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateBR, spParts, todayISO } from "@/lib/dates";
import { whatsappLink } from "@/lib/contact";
import { getLookups } from "@/features/financeiro/queries";
import { getBudgetForService, getCommercialLookups, getService, listAttachments, listPayments, listServiceCosts } from "@/features/comercial/queries";
import { ServiceDetail } from "@/features/comercial/components/service-detail";
import { serviceBadge } from "@/features/comercial/status";
import { Badge } from "@/components/ui/badge";
import { SERVICE_STATUS_LABEL } from "@/features/comercial/types";

export const metadata: Metadata = { title: "Serviço" };
export const dynamic = "force-dynamic";

export default async function ServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const service = await getService(id);
  if (!service) notFound();
  const [costs, payments, attachments, lookups, money, budget] = await Promise.all([
    listServiceCosts(id), listPayments({ serviceId: id }), listAttachments("service", id), getCommercialLookups(), getLookups(), getBudgetForService(id),
  ]);
  const when = spParts(service.scheduledAt);
  const wa = whatsappLink(service.customerPhone, `Olá, ${service.customerName.split(" ")[0]}! Aqui é da Forte Duto sobre o seu serviço.`);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <Link href="/servicos" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Serviços
      </Link>

      <Card className="grid gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{service.typeName ?? "Serviço"}</h1>
            <Link href={`/clientes/${service.customerId}`} className="font-medium text-info hover:underline">
              {service.customerName}
            </Link>
          </div>
          <Badge variant={serviceBadge(service.status)}>{SERVICE_STATUS_LABEL[service.status]}</Badge>
        </div>
        {service.description && <p className="whitespace-pre-line">{service.description}</p>}
        <dl className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            {when ? `${formatDateBR(when.date)} às ${when.time}` : `Pedido em ${formatDateBR(service.requestedDate)} · sem dia marcado`}
          </div>
          {service.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address)}`} target="_blank" rel="noreferrer" className="hover:underline">
                {service.address}
              </a>
            </div>
          )}
          {service.responsibleName && (
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" aria-hidden /> {service.responsibleName}
            </div>
          )}
          {budget && (
            <p className="text-muted-foreground">
              Veio do <Link className="font-medium text-info hover:underline" href={`/orcamentos/${budget.id}`}>orçamento nº {budget.number}</Link>
            </p>
          )}
          {service.notes && <p className="whitespace-pre-line rounded-lg bg-secondary/60 p-3">{service.notes}</p>}
        </dl>
        {wa && (
          <Button asChild variant="outline" size="lg">
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle /> Falar com o cliente
            </a>
          </Button>
        )}
      </Card>

      <ServiceDetail service={service} costs={costs} payments={payments} attachments={attachments} lookups={lookups} money={money} today={todayISO()} />
    </div>
  );
}
