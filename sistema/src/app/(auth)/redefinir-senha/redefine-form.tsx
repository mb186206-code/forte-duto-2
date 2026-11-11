"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { NewPasswordForm } from "@/components/forms/new-password-form";

export function RedefineForm() {
  const router = useRouter();
  const done = useCallback(() => router.replace("/dashboard"), [router]);
  return <NewPasswordForm onSuccess={done} submitLabel="Salvar e entrar" />;
}
