import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Database, History, ListChecks, Palette, Smartphone, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserName } from "@/lib/access/session";
import { getAccessConfig } from "@/lib/access/config";
import { getLists } from "@/features/configuracoes/queries";
import { getSettings } from "@/features/relatorios/queries";
import { CompanyForm } from "@/features/configuracoes/components/company-form";
import { ListEditor } from "@/features/configuracoes/components/list-editor";
import { ThemeChoice } from "./theme-choice";
import { LeaveButton } from "./leave-button";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

function SectionTitle({ icon: Icon, children }: { icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2">
      <Icon className="size-5 text-info" aria-hidden />
      {children}
    </CardTitle>
  );
}

export default async function SettingsPage() {
  const name = (await getCurrentUserName()) ?? "";
  const hasLogin = getAccessConfig() !== null;
  const [settings, lists] = await Promise.all([getSettings(), getLists()]);

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-5">
      <PageHeader title="Configurações" />

      <Card>
        <CardHeader>
          <SectionTitle icon={UserRound}>Quem está usando</SectionTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{name}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle icon={Building2}>Dados da empresa e metas</SectionTitle>
          <CardDescription>Aparecem nos relatórios. As metas mostram o quanto você já atingiu no mês.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm settings={settings} />
        </CardContent>
      </Card>

      <section className="grid gap-3" aria-labelledby="listas">
        <h2 id="listas" className="flex items-center gap-2 px-1 text-lg font-semibold">
          <ListChecks className="size-5 text-info" aria-hidden /> Listas do sistema
        </h2>
        <ListEditor listKey="despesa" title="Tipos de despesa" description="Para separar para onde vai o dinheiro. Escolha como cada um entra no lucro." items={lists.despesa} />
        <ListEditor listKey="entrada" title="Tipos de entrada" description="Prestação de serviço, venda de material, etc." items={lists.entrada} />
        <ListEditor listKey="pagamento" title="Formas de pagamento" description="Pix, dinheiro, cartão…" items={lists.pagamento} />
        <ListEditor listKey="servico" title="Tipos de serviço" description="O que a empresa faz. Aparece nos serviços, orçamentos e campanhas." items={lists.servico} />
        <ListEditor listKey="origem" title="Como o cliente conheceu a empresa" description="Marque os que são anúncio pago." items={lists.origem} />
      </section>

      <Card>
        <CardHeader>
          <SectionTitle icon={Database}>Cópia dos dados</SectionTitle>
          <CardDescription>Baixe um arquivo com tudo o que está cadastrado (clientes, serviços, dinheiro, campanhas). Guarde em lugar seguro. As fotos não vão no arquivo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <a href="/configuracoes/backup" download className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border bg-card px-6 text-base font-semibold hover:bg-accent">
            <Database className="size-5" aria-hidden /> Baixar cópia dos dados
          </a>
          <Link href="/configuracoes/historico" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border bg-card px-6 text-base font-semibold hover:bg-accent">
            <History className="size-5" aria-hidden /> Ver quem mudou o quê
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle icon={Palette}>Aparência</SectionTitle>
          <CardDescription>O escuro cansa menos a vista à noite.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeChoice />
        </CardContent>
      </Card>

      {hasLogin && (
        <Card>
          <CardHeader>
            <SectionTitle icon={Smartphone}>Este celular</SectionTitle>
            <CardDescription>Use se o celular for emprestado, trocado ou perdido.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
