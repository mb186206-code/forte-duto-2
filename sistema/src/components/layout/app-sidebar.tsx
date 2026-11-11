import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import type { Role } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { SidebarNav } from "./sidebar-nav";

export function SidebarBody({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-indicator/70">
          <Logo />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarNav role={role} onNavigate={onNavigate} />
      </div>
      <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/80">
        Acesso: <span className="font-semibold text-sidebar-foreground-strong">{ROLE_LABELS[role]}</span>
      </div>
    </div>
  );
}

/** Menu lateral fixo (telas grandes). */
export function AppSidebar({ role }: { role: Role }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border lg:block">
      <SidebarBody role={role} />
    </aside>
  );
}
