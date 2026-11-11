import type { Metadata } from "next";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { getAccessConfig } from "@/lib/access/config";
import { EntryForm } from "./entry-form";

// lê as variáveis de ambiente a cada acesso (não congela no build)
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Entrar" };

export default function EntryPage() {
  const askCode = getAccessConfig() !== null;
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="relative overflow-hidden bg-brand-navy px-6 pt-6 pb-16 text-white">
        <div aria-hidden className="absolute bottom-0 left-0 h-1.5 w-full bg-brand-yellow" />
        <Logo />
        <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
          <Image
            src="/forte-duto-mascote.webp"
            alt="Forte Duto"
            width={96}
            height={96}
            className="rounded-full ring-4 ring-white/10"
            priority
          />
          <h1 className="mt-5 font-display text-3xl font-bold">Bem-vindo!</h1>
          <p className="mt-1 text-white/75">{askCode ? "Digite seu nome e o código da empresa." : "Digite seu nome para começar."}</p>
        </div>
      </div>
      <div className="relative z-10 mx-auto -mt-8 w-full max-w-sm px-4 pb-10">
        <div className="rounded-2xl border bg-card p-5 shadow-lg">
          <EntryForm askCode={askCode} />
        </div>
      </div>
    </main>
  );
}
