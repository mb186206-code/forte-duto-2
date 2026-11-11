import Image from "next/image";
import { ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Painel da marca (desktop) */}
      <aside className="relative hidden overflow-hidden bg-brand-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full border-[56px] border-white/[0.04]"
        />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-full bg-brand-yellow" />
        <Logo />
        <div className="relative max-w-md">
          <Image
            src="/forte-duto-mascote.webp"
            alt="Forte Duto — desentupidora e hidráulica"
            width={120}
            height={120}
            className="mb-8 rounded-full ring-4 ring-white/10"
            priority
          />
          <h2 className="font-display text-4xl leading-tight font-bold">
            Sua empresa organizada, <span className="text-brand-yellow">do primeiro contato ao dinheiro no caixa.</span>
          </h2>
          <ul className="mt-8 grid gap-4 text-[0.95rem] text-white/80">
            <li className="flex items-center gap-3">
              <Wallet className="size-5 text-brand-yellow" aria-hidden /> Entradas, despesas e saldo sempre corretos
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp className="size-5 text-brand-yellow" aria-hidden /> Clientes, serviços e resultado dos anúncios
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-brand-yellow" aria-hidden /> Acesso protegido por função de cada pessoa
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} Forte Duto · Uso interno</p>
      </aside>

      {/* Formulário */}
      <main className="flex flex-col">
        <div className="flex h-16 items-center bg-brand-navy px-5 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
