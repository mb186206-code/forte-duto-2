import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, { text: string; variant: "info" | "warning" | "success" }> = {
  saiu: { text: "Você saiu do sistema com segurança.", variant: "success" },
  inativo: { text: "Seu acesso está desativado. Fale com o administrador da empresa.", variant: "warning" },
  "link-invalido": { text: "O link expirou ou já foi usado. Peça um novo em “Esqueci minha senha”.", variant: "warning" },
  "senha-alterada": { text: "Senha alterada. Entre com a nova senha.", variant: "success" },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { motivo, next } = await searchParams;
  const notice = motivo ? NOTICES[motivo] : undefined;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entrar no sistema</h1>
        <p className="mt-1.5 text-muted-foreground">Use o e-mail e a senha cadastrados pela empresa.</p>
      </div>
      {notice && (
        <Alert variant={notice.variant}>
          <Info />
          <AlertDescription className="text-foreground">{notice.text}</AlertDescription>
        </Alert>
      )}
      <LoginForm next={next} />
      <p className="text-center text-xs text-muted-foreground">
        Não tem acesso? Peça ao administrador da Forte Duto para criar seu usuário.
      </p>
    </div>
  );
}
