import { describe, expect, it } from "vitest";
import { newPasswordSchema, profileSchema, signInSchema } from "./auth";
import { safeNextPath } from "@/lib/auth/routes";

describe("validação de login", () => {
  it("normaliza e-mail", () => {
    const r = signInSchema.parse({ email: "  Daniel@Exemplo.com ", password: "x" });
    expect(r.email).toBe("daniel@exemplo.com");
  });
  it("e-mail inválido tem mensagem em português", () => {
    const r = signInSchema.safeParse({ email: "daniel", password: "x" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/E-mail inválido/);
  });
});

describe("nova senha", () => {
  it("exige 8+ caracteres com letras e números", () => {
    expect(newPasswordSchema.safeParse({ password: "abc", confirm: "abc" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "abcdefgh", confirm: "abcdefgh" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd1234" }).success).toBe(true);
  });
  it("confirmação precisa ser igual", () => {
    const r = newPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd12345" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["confirm"]);
  });
});

describe("perfil", () => {
  it("telefone opcional", () => {
    expect(profileSchema.parse({ full_name: "Daniel", phone: "" }).phone).toBeNull();
    expect(profileSchema.safeParse({ full_name: "Daniel", phone: "1234" }).success).toBe(false);
    expect(profileSchema.parse({ full_name: "Daniel", phone: "(21) 98711-4521" }).phone).toBe("(21) 98711-4521");
  });
});

describe("redirecionamento seguro após login", () => {
  it.each([
    [null, "/dashboard"],
    ["/financeiro", "/financeiro"],
    ["/clientes?busca=ana", "/clientes?busca=ana"],
    ["https://site-malicioso.com", "/dashboard"],
    ["//site-malicioso.com", "/dashboard"],
    ["/\\site-malicioso.com", "/dashboard"],
    ["/login", "/dashboard"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
