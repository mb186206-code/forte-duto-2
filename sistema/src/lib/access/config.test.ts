import { describe, expect, it } from "vitest";
import { findUser, parseUsers, userKey } from "./config";

describe("usuários do sistema", () => {
  const users = parseUsers("pedro:1234, daniel:1234 ,antony:s3nha:com:dois");
  it("lê nome:senha e capitaliza o nome", () => {
    expect(users.map((u) => u.name)).toEqual(["Pedro", "Daniel", "Antony"]);
    expect(users[2].password).toBe("s3nha:com:dois");
  });
  it("ignora entradas inválidas", () => {
    expect(parseUsers(":1234,sem-senha,x:")).toEqual([]);
    expect(parseUsers(undefined)).toEqual([]);
  });
  it("acha o usuário sem diferenciar maiúsculas e acentos", () => {
    expect(findUser(users, "  PEDRO ")?.name).toBe("Pedro");
    expect(findUser(users, "joao")).toBeUndefined();
  });
  it("a chave do passe muda quando a senha muda", () => {
    expect(userKey({ name: "Pedro", password: "1" })).not.toBe(userKey({ name: "Pedro", password: "2" }));
  });
});
