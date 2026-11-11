"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const FILES = [
  { tipo: "lancamentos", label: "Lançamentos do mês" },
  { tipo: "servicos", label: "Serviços" },
  { tipo: "clientes", label: "Clientes" },
  { tipo: "orcamentos", label: "Orçamentos" },
] as const;

/** Imprimir (ou salvar em PDF pelo celular) e baixar planilhas que o Excel abre direto. */
export function ReportActions({ month }: { month: string }) {
  return (
    <div className="grid gap-2" data-no-print>
      <Button size="lg" variant="highlight" onClick={() => window.print()}>
        <Printer /> Imprimir / salvar em PDF
      </Button>
      <details className="rounded-xl border bg-card">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 font-semibold">
          <Download className="size-5" aria-hidden /> Baixar planilha (Excel)
        </summary>
        <ul className="grid gap-1 border-t p-2">
          {FILES.map((f) => (
            <li key={f.tipo}>
              <a href={`/relatorios/exportar?tipo=${f.tipo}&mes=${month}`} className="flex min-h-11 items-center rounded-lg px-3 hover:bg-accent" download>
                {f.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
