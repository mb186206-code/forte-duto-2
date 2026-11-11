import type { Metadata } from "next";
import { Palette, Smartphone, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserName } from "@/lib/access/session";
import { getAccessConfig } from "@/lib/access/config";
import { ThemeChoice } from "./theme-choice";
import { LeaveButton } from "./leave-button";

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
  const name = (await getCurrentUserName()) ?? "";
  const hasLogin = getAccessConfig() !== null;

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
