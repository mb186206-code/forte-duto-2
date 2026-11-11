import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getCurrentUserName } from "@/lib/access/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userName = await getCurrentUserName();
  if (!userName) redirect("/entrar");
  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-highlight focus:px-4 focus:py-2 focus:font-semibold focus:text-highlight-foreground"
      >
        Pular para o conteúdo
      </a>
      <AppSidebar userName={userName} />
      <div className="min-w-0 lg:pl-72">
        <Topbar userName={userName} />
        <main id="conteudo" className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
      <BottomNav userName={userName} />
    </div>
  );
}
