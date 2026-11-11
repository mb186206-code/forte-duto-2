"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/lib/money";
import type { MonthPoint } from "../queries";

const SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Entrou × saiu nos últimos meses. Valores em reais só na exibição; os dados vêm em centavos. */
export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  const points = data.map((d) => ({ name: SHORT[Number(d.month.slice(5)) - 1], Entrou: d.in / 100, Saiu: d.out / 100 }));
  const empty = data.every((d) => d.in === 0 && d.out === 0);
  if (empty) {
    return <p className="py-8 text-center text-sm text-muted-foreground">O gráfico aparece quando houver dinheiro recebido ou pago.</p>;
  }
  return (
    <div className="h-56 w-full" role="img" aria-label="Gráfico de entradas e saídas dos últimos meses">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            formatter={(v) => formatBRL(Math.round(Number(v) * 100))}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}
          />
          <Bar dataKey="Entrou" fill="var(--success)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Saiu" fill="var(--destructive)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
