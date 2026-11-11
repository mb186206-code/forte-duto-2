"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { canAccess, type Role } from "@/lib/auth/permissions";
import { NAV_ITEMS, isAvailable } from "./navigation";

/** Lista de módulos do menu lateral (usada no desktop e no menu do celular). */
export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => canAccess(role, item.key));

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9rem] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-indicator/70",
              active
                ? "bg-sidebar-accent text-sidebar-foreground-strong"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground-strong",
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-indicator"
                className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sidebar-indicator"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <Icon className={cn("size-[1.15rem] shrink-0", active ? "text-sidebar-indicator" : "opacity-80")} aria-hidden />
            <span className="flex-1 truncate">{item.label}</span>
            {!isAvailable(item.phase) && (
              <span className="rounded-full border border-sidebar-border px-1.5 py-px text-[0.62rem] font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
                Fase {item.phase}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
