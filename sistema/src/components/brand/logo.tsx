import { cn } from "@/lib/utils";

/** Marca compacta: monograma "FD" com a faixa amarela da marca. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-navy ring-1 ring-white/15",
        className,
      )}
    >
      <span className="font-display text-[1.35rem] leading-none font-bold tracking-tight text-white">
        F<span className="text-brand-yellow">D</span>
      </span>
      <span className="absolute inset-x-2 bottom-1.5 h-[3px] rounded-full bg-brand-yellow" />
    </span>
  );
}

/** Marca completa: monograma + "FORTE DUTO / Gestão". */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-xl font-bold tracking-wide uppercase",
            tone === "light" ? "text-white" : "text-brand-navy dark:text-white",
          )}
        >
          Forte Duto
        </span>
        <span
          className={cn(
            "mt-1 text-[0.68rem] font-semibold tracking-[0.18em] uppercase",
            tone === "light" ? "text-brand-yellow" : "text-brand-blue dark:text-brand-yellow",
          )}
        >
          Gestão
        </span>
      </span>
    </span>
  );
}
