import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Valor em reais; verde se entrou, vermelho se saiu, neutro nos demais casos. */
export function Money({ cents, tone = "neutral", signed = false, className }: { cents: number; tone?: "in" | "out" | "neutral" | "auto"; signed?: boolean; className?: string }) {
  const t = tone === "auto" ? (cents > 0 ? "in" : cents < 0 ? "out" : "neutral") : tone;
  const text = signed && cents > 0 ? `+ ${formatBRL(cents)}` : signed && cents < 0 ? `− ${formatBRL(Math.abs(cents))}` : formatBRL(cents);
  return <span className={cn("tabular-nums", t === "in" && "text-success", t === "out" && "text-destructive", className)}>{text}</span>;
}
