import type { Metadata } from "next";
import { KeyRound, Palette, UserRound, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { NewPasswordForm } from "@/components/forms/new-password-form";
import { requireModule } from "@/lib/auth/session";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, isRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { ThemeChoice } from "./theme-choice";

export const metadata: Metadata = { title: "Configurações" };

function SectionTitle({ icon: Icon, children }: { icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2">
      <Icon className="size-5 text-info" aria-hidden />
      {children}
    </CardTitle>
  );
}

export default async function SettingsPage() {
  const user = await requireModule("configuracoes");
  const isAdmin = user.role === "admin";

  let team: { id: string; full_name: string; email: string; role: string; active: boolean }[] = [];
  if (isAdmin) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("id, full_name, email, role, active").order("full_name");
    team = data ?? [];
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <PageHeader title="Configurações" description="Seu perfil, senha e aparência do sistema." />

      <Card>
        <CardHeader>
          <SectionTitle icon={UserRound}>Meu perfil</SectionTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            Função: <Badge variant="info">{ROLE_LABELS[user.role]}</Badge>
            <span>{ROLE_DESCRIPTIONS[user.role]}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={user.fullName} email={user.email} phone={user.phone} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card id="senha" className="scroll-mt-24">
          <CardHeader>
            <SectionTitle icon={KeyRound}>Alterar senha</SectionTitle>
            <CardDescription>Use uma senha que você não usa em outros sites.</CardDescription>
          </CardHeader>
          <CardContent>
            <NewPasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={Palette}>Aparência</SectionTitle>
            <CardDescription>O tema claro é o padrão. O escuro cansa menos a vista à noite.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeChoice />
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <SectionTitle icon={UsersRound}>Equipe e permissões</SectionTitle>
            <CardDescription>
              Pessoas com acesso ao sistema. Convidar, mudar função e desativar usuários chega na Fase 5; até lá, novos
              usuários são criados pelo painel do Supabase (veja o README).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-xl border">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-3">
                  <Avatar name={m.full_name || m.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.full_name || "Sem nome"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  {!m.active && <Badge variant="danger">Desativado</Badge>}
                  <Badge variant={m.role === "admin" ? "highlight" : "default"}>{isRole(m.role) ? ROLE_LABELS[m.role] : m.role}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
