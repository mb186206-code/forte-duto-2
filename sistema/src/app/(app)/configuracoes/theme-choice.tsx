"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
] as const;

export function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- evita divergência de hidratação do tema
  useEffect(() => setMounted(true), []);

  return (
    <div role="radiogroup" aria-label="Tema" className="grid max-w-sm grid-cols-2 gap-3">
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const selected = mounted && theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(o.value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none",
              selected ? "border-info bg-info-soft text-foreground ring-1 ring-info" : "bg-card hover:bg-accent",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
