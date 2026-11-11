import type { Metadata } from "next";
import { Database } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Configuração pendente" };

/** Aparece quando o sistema foi publicado sem as variáveis do Supabase. */
export default function SetupPendingPage() {
  if (getSupabaseEnv()) redirect("/login");
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="flex h-16 items-center bg-brand-navy px-5">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 px-5 py-12">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <Database className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">O banco de dados ainda não foi conectado</h1>
        <p className="text-muted-foreground">
          O sistema precisa das variáveis do Supabase para funcionar. Nada foi salvo ou simulado. Peça ao responsável
          técnico para configurar:
        </p>
        <ul className="grid gap-2 rounded-xl border bg-card p-4 font-mono text-sm">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
        </ul>
        <p className="text-sm text-muted-foreground">O passo a passo está no arquivo README.md do projeto.</p>
      </div>
    </main>
  );
}
