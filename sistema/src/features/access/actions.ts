"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findUser, getAccessConfig, userKey } from "@/lib/access/config";
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

/** Entra com nome e senha. Este celular fica liberado por mais de um ano. */
export async function enter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = entrySchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password") ?? undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const access = getAccessConfig();
  const store = await cookies();
  let displayName = parsed.data.name;

  if (access) {
    const typed = parsed.data.password ?? "";
    if (!typed) return { status: "error", fieldErrors: { password: "Digite sua senha." } };
    const user = findUser(access.users, parsed.data.name);
    if (!user || !codesMatch(typed, user.password)) {
      // pausa curta para dificultar tentativas em sequência
      await new Promise((r) => setTimeout(r, 800));
      return { status: "error", fieldErrors: { password: "Nome ou senha errados." } };
    }
    displayName = user.name;
    store.set(ACCESS_COOKIE, await signAccess(access.secret, userKey(user)), cookieOptions);
  }

  store.set(NAME_COOKIE, encodeURIComponent(displayName), cookieOptions);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Tira o acesso deste celular (ex.: aparelho emprestado ou perdido). */
export async function leaveDevice(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(NAME_COOKIE);
  revalidatePath("/", "layout");
  redirect("/entrar");
}
