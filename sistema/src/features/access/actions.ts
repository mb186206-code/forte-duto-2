"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccessConfig } from "@/lib/access/config";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, NAME_COOKIE, codesMatch, signAccess } from "@/lib/access/token";
import { entrySchema, fieldErrors } from "@/lib/validation/access";
import type { FormState } from "@/lib/form-state";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACCESS_MAX_AGE,
};

/** Libera este celular: guarda o nome e, se houver, o passe do código da empresa. */
export async function enter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = entrySchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") ?? undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const access = getAccessConfig();
  const store = await cookies();

  if (access) {
    const typed = parsed.data.code ?? "";
    if (!typed) return { status: "error", fieldErrors: { code: "Digite o código da empresa." } };
    if (!codesMatch(typed, access.code)) {
      // pausa curta para dificultar tentativas em sequência
      await new Promise((r) => setTimeout(r, 800));
      return { status: "error", fieldErrors: { code: "Código errado. Confira com o Daniel." } };
    }
    store.set(ACCESS_COOKIE, await signAccess(access.secret, access.code), cookieOptions);
  }

  store.set(NAME_COOKIE, encodeURIComponent(parsed.data.name), cookieOptions);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Muda o nome de quem usa este celular. */
export async function changeName(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = entrySchema.pick({ name: true }).safeParse({ name: formData.get("name") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  (await cookies()).set(NAME_COOKIE, encodeURIComponent(parsed.data.name), cookieOptions);
  revalidatePath("/", "layout");
  return { status: "success", message: "Nome salvo." };
}

/** Tira o acesso deste celular (ex.: aparelho emprestado ou perdido). */
export async function leaveDevice(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(NAME_COOKIE);
  revalidatePath("/", "layout");
  redirect("/entrar");
}
