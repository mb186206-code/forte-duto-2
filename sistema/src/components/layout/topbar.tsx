import type { CurrentUser } from "@/lib/auth/session";
import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { QuickActions } from "./quick-actions";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <MobileNav role={user.role} />
        <div className="min-w-0 flex-1">
          <CommandMenu role={user.role} />
        </div>
        <QuickActions role={user.role} />
        <ThemeToggle />
        <UserMenu name={user.fullName} email={user.email} role={user.role} />
      </div>
    </header>
  );
}
