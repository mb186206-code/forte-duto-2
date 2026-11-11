import { describe, expect, it } from "vitest";
import { codesMatch, signAccess, verifyAccess, ACCESS_MAX_AGE } from "./token";

const SECRET = "x".repeat(40);

describe("passe de acesso do celular", () => {
  it("passe válido é aceito", async () => {
    const t = await signAccess(SECRET, "123456");
    expect(await verifyAccess(t, SECRET, "123456")).toBe(true);
  });
  it("trocar o código invalida os passes antigos", async () => {
    const t = await signAccess(SECRET, "123456");
    expect(await verifyAccess(t, SECRET, "654321")).toBe(false);
  });
  it("passe adulterado ou vazio é recusado", async () => {
    const t = await signAccess(SECRET, "123456");
    expect(await verifyAccess(t.slice(0, -2) + "xx", SECRET, "123456")).toBe(false);
    expect(await verifyAccess("999.abc", SECRET, "123456")).toBe(false);
    expect(await verifyAccess(undefined, SECRET, "123456")).toBe(false);
    expect(await verifyAccess("lixo", SECRET, "123456")).toBe(false);
  });
  it("passe vencido é recusado", async () => {
    const old = Date.now() - (ACCESS_MAX_AGE + 10) * 1000;
    const t = await signAccess(SECRET, "123456", old);
    expect(await verifyAccess(t, SECRET, "123456")).toBe(false);
  });
  it("compara código ignorando espaços", () => {
    expect(codesMatch("123 456", "123456")).toBe(true);
    expect(codesMatch("123457", "123456")).toBe(false);
  });
});
