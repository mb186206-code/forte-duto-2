import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Sem permissão" };

export default async function NoPermissionPage({ searchParams }: { searchParams: Promise<{ modulo?: string }> }) {
  const user = await requireUser();
  const { modulo } = await searchParams;
  const item = NAV_ITEMS.find((i) => i.key === modulo);

  return (
    <EmptyState
      icon={Lock}
      title="Você não tem acesso a esta área"
      description={
        <>
          {item ? <>O módulo <strong>{item.label}</strong> não faz parte </> : "Esta área não faz parte "}
          do perfil <strong>{ROLE_LABELS[user.role]}</strong>. Se precisar, peça ao administrador para ajustar sua função.
        </>
      }
      action={
        <Button asChild>
          <Link href="/dashboard">Voltar ao início</Link>
        </Button>
      }
    />
  );
}
