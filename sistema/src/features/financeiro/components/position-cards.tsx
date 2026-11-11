import { Card } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import type { Position } from "../types";

/** Quanto a empresa tem: livre para usar em destaque; o resto explica de onde vem. */
export function PositionCards({ position }: { position: Position }) {
  return (
    <div className="grid gap-3">
      <Card className="bg-brand-navy p-5 text-white">
        <p className="text-sm font-medium text-white/75">Livre para usar</p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          <Money cents={position.free} className={position.free < 0 ? "text-[#ff9b9b]" : undefined} />
        </p>
        <p className="mt-1 text-xs text-white/65">Dinheiro nas contas menos o que está guardado nos fundos.</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Nas contas</p>
          <Money cents={position.available} className="text-lg font-bold" />
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Guardado nos fundos</p>
          <Money cents={position.reserved} className="text-lg font-bold" />
        </Card>
      </div>
    </div>
  );
}
