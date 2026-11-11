import Link from "next/link";
import type { CurrentUser } from "@/lib/auth/session";
import { LogoMark } from "@/components/brand/logo";
import { CommandMenu } from "./command-menu";
import { QuickActions } from "./quick-actions";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:gap-3">
        {/* celular: só a marca, a busca e a conta */}
        <Link href="/dashboard" aria-label="Início" className="flex items-center gap-2.5 lg:hidden">
          <LogoMark className="size-9" />
          <span className="font-display text-lg font-bold tracking-wide text-brand-navy uppercase dark:text-white">Forte Duto</span>
        </Link>
        <div className="flex min-w-0 flex-1 justify-end lg:justify-start">
          <CommandMenu role={user.role} />
        </div>
        <QuickActions role={user.role} />
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
        <UserMenu name={user.fullName} email={user.email} role={user.role} />
      </div>
    </header>
  );
}
