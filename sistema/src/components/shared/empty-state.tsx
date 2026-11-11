import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estado vazio com orientação do que fazer a seguir. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-info-soft text-info">
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <div className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
