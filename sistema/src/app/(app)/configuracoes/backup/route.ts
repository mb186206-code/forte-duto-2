import { NextResponse } from "next/server";
import { getCurrentUserName } from "@/lib/access/session";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLES = [
  "company_settings", "expense_categories", "revenue_categories", "payment_methods", "service_types", "customer_sources",
  "accounts", "transactions", "funds", "fund_movements",
  "customers", "customer_attributions", "budgets", "budget_items", "services", "service_items",
  "campaigns", "advertisements", "campaign_metrics", "attachments",
] as const;

/** Cópia de segurança: um arquivo com todos os cadastros (as fotos ficam no armazenamento e não vão aqui). */
export async function GET() {
  const name = await getCurrentUserName();
  if (!name) return new NextResponse("Entre no sistema primeiro.", { status: 401 });
  const db = await createClient();
  const out: Record<string, unknown> = { gerado_em: new Date().toISOString(), gerado_por: name, tabelas: {} };
  const tables = out.tabelas as Record<string, unknown[]>;
  for (const t of TABLES) {
    const res = await db.from(t).select("*").limit(100000);
    if (res.error) return new NextResponse(`Não foi possível ler ${t}.`, { status: 500 });
    tables[t] = res.data ?? [];
  }
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="forte-duto-copia-${todayISO()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
