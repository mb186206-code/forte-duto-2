import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FilePlus2, MapPin, MessageCircle, Phone, Wrench } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { formatPhone, whatsappLink } from "@/lib/contact";
import { formatDateBR, spParts } from "@/lib/dates";
import { sumCents } from "@/lib/money";
import { getCommercialLookups, getCustomer, listBudgets, listPayments, listServices } from "@/features/comercial/queries";
import { CustomerActions } from "@/features/comercial/components/customer-actions";
import { customerBadge } from "@/features/comercial/status";
import { BUDGET_STATUS_LABEL, CUSTOMER_STATUS_LABEL, SERVICE_STATUS_LABEL } from "@/features/comercial/types";

export const metadata: Metadata = { title: "Cliente" };
export const dynamic = "force-dynamic";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const [lookups, services, budgets, payments] = await Promise.all([
    getCommercialLookups(),
    listServices({ customerId: id }),
    listBudgets({ customerId: id }),
    listPayments({ customerId: id }),
  ]);
  const paid = sumCents(payments.filter((p) => p.status === "efetivado").map((p) => p.amount));
  const open = sumCents(payments.filter((p) => p.status === "pendente").map((p) => p.amount));
  const phone = customer.whatsapp || customer.phone;
  const wa = whatsappLink(phone, `Olá, ${customer.name.split(" ")[0]}! Aqui é da Forte Duto.`);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <Link href="/clientes" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Clientes
      </Link>

      <Card className="grid gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <Badge variant={customerBadge(customer.status)}>{CUSTOMER_STATUS_LABEL[customer.status]}</Badge>
        </div>
        <dl className="grid gap-2 text-sm">
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" aria-hidden />
              <a href={`tel:${phone.replace(/\D/g, "")}`} className="font-medium hover:underline">
                {formatPhone(phone)}
              </a>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
              <span>{customer.address}</span>
            </div>
          )}
          {customer.requestedService && <p><span className="text-muted-foreground">Precisa de: </span>{customer.requestedService}</p>}
          {customer.estimatedValue != null && (
            <p><span className="text-muted-foreground">Valor estimado: </span><Money cents={customer.estimatedValue} /></p>
          )}
          <p><span className="text-muted-foreground">Como conheceu: </span>{customer.sourceName ?? "Não informado"}</p>
          {customer.notes && <p className="whitespace-pre-line rounded-lg bg-secondary/60 p-3">{customer.notes}</p>}
        </dl>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {wa && (
            <Button asChild size="lg" variant="outline">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
          <Button asChild size="lg" variant="outline">
            <Link href={`/orcamentos?novo=1&cliente=${id}`}>
              <FilePlus2 /> Novo orçamento
            </Link>
          </Button>
          <Button asChild size="lg" variant="highlight">
            <Link href={`/servicos?novo=1&cliente=${id}`}>
              <Wrench /> Novo serviço
            </Link>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Já pagou</p>
          <p className="mt-1 text-xl font-bold"><Money cents={paid} tone="in" /></p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Falta pagar</p>
          <p className="mt-1 text-xl font-bold"><Money cents={open} /></p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Serviços</h2>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço ainda.</p>
        ) : (
          <ul className="divide-y">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/servicos/${s.id}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.typeName ?? s.description ?? "Serviço"}</p>
                    <p className="text-xs text-muted-foreground">{s.scheduledAt ? formatDateBR(spParts(s.scheduledAt)?.date) : formatDateBR(s.requestedDate)}</p>
                  </div>
                  <Badge variant={s.status === "concluido" ? "success" : s.status === "cancelado" ? "outline" : "info"}>{SERVICE_STATUS_LABEL[s.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Orçamentos</h2>
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum orçamento ainda.</p>
        ) : (
          <ul className="divide-y">
            {budgets.map((b) => (
              <li key={b.id}>
                <Link href={`/orcamentos/${b.id}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">Orçamento nº {b.number}</p>
                    <p className="text-xs text-muted-foreground">{formatDateBR(b.issueDate)} · <Money cents={b.total} /></p>
                  </div>
                  <Badge variant={b.status === "aprovado" ? "success" : b.status === "aguardando" ? "warning" : "outline"}>{BUDGET_STATUS_LABEL[b.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CustomerActions customer={customer} lookups={lookups} />
    </div>
  );
}
