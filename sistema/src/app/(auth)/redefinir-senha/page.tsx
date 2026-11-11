import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { RedefineForm } from "./redefine-form";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function RedefinePage() {
  // Só chega aqui quem abriu o link de recuperação (que cria uma sessão temporária).
  const user = await requireUser();
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Criar nova senha</h1>
        <p className="mt-1.5 text-muted-foreground">
          Conta: <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>
      <RedefineForm />
    </div>
  );
}
