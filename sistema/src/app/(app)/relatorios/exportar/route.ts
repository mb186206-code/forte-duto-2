import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserName } from "@/lib/access/session";
import { currentMonth, formatDateBR, isMonth, monthRange, spParts } from "@/lib/dates";
import { listBudgets, listCustomers, listServices } from "@/features/comercial/queries";
import { BUDGET_STATUS_LABEL, CUSTOMER_STATUS_LABEL, SERVICE_STATUS_LABEL } from "@/features/comercial/types";
import { centsToCsv, toCsv } from "@/features/relatorios/compute";
import { getReportTransactions } from "@/features/relatorios/queries";

export const dynamic = "force-dynamic";

const KIND = { receita: "Entrada", despesa: "Despesa", transferencia: "Transferência" } as const;
const STATUS = { pendente: "Pendente", efetivado: "Pago/recebido", cancelado: "Cancelado" } as const;

/** Planilhas do mês em CSV (o Excel abre direto). Só para quem entrou no sistema. */
export async function GET(request: NextRequest) {
  if (!(await getCurrentUserName())) return new NextResponse("Entre no sistema primeiro.", { status: 401 });
  const tipo = request.nextUrl.searchParams.get("tipo");
  const mes = request.nextUrl.searchParams.get("mes");
  const month = isMonth(mes) ? mes : currentMonth();
  const { from, to } = monthRange(month);
  const inMonth = (d: string | null | undefined) => !!d && d >= from && d <= to;

  let csv: string;
  if (tipo === "lancamentos") {
    const rows = (await getReportTransactions(month)).filter((t) => inMonth(t.settledDate ?? t.competenceDate) || inMonth(t.competenceDate));
    csv = toCsv(
      ["Data", "Tipo", "Situação", "Descrição", "Categoria", "Conta", "Forma de pagamento", "Pago a", "Valor (R$)"],
      rows.map((t) => [formatDateBR(t.settledDate ?? t.dueDate ?? t.competenceDate), KIND[t.kind], STATUS[t.status], t.description, t.categoryName, t.accountName, t.paymentMethodName, t.supplier, centsToCsv(t.amount)]),
    );
  } else if (tipo === "servicos") {
    const rows = (await listServices()).filter((s) => inMonth(s.requestedDate) || inMonth(spParts(s.scheduledAt)?.date) || inMonth(spParts(s.completedAt)?.date));
    csv = toCsv(
      ["Cliente", "Serviço", "Situação", "Pedido em", "Marcado para", "Concluído em", "Valor combinado (R$)", "Custos (R$)", "Recebido (R$)", "Sobra (R$)"],
      rows.map((s) => [
        s.customerName, s.typeName ?? s.description, SERVICE_STATUS_LABEL[s.status], formatDateBR(s.requestedDate), s.scheduledAt ? formatDateBR(spParts(s.scheduledAt)?.date) : "",
        s.completedAt ? formatDateBR(spParts(s.completedAt)?.date) : "", s.contractValue === null ? "" : centsToCsv(s.contractValue), centsToCsv(s.totalCost), centsToCsv(s.received), centsToCsv((s.contractValue ?? 0) - s.totalCost),
      ]),
    );
  } else if (tipo === "clientes") {
    const rows = (await listCustomers()).filter((c) => inMonth(spParts(c.createdAt)?.date));
    csv = toCsv(
      ["Nome", "Telefone", "Endereço", "Situação", "Como conheceu", "Cadastrado em"],
      rows.map((c) => [c.name, c.whatsapp ?? c.phone, c.address, CUSTOMER_STATUS_LABEL[c.status], c.sourceName, formatDateBR(spParts(c.createdAt)?.date)]),
    );
  } else if (tipo === "orcamentos") {
    const rows = (await listBudgets()).filter((b) => inMonth(b.issueDate));
    csv = toCsv(
      ["Número", "Cliente", "Data", "Vale até", "Situação", "Total (R$)"],
      rows.map((b) => [b.number, b.customerName, formatDateBR(b.issueDate), b.validUntil ? formatDateBR(b.validUntil) : "", BUDGET_STATUS_LABEL[b.status], centsToCsv(b.total)]),
    );
  } else {
    return new NextResponse("Tipo de planilha inválido.", { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="forte-duto-${tipo}-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
