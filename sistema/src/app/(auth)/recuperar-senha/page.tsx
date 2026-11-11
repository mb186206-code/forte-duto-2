import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPage() {
  return (
    <div className="grid gap-8">
      <Link href="/login" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para o login
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="mt-1.5 text-muted-foreground">
          Informe seu e-mail. Vamos enviar um link para você criar uma senha nova.
        </p>
      </div>
      <ResetRequestForm />
    </div>
  );
}
