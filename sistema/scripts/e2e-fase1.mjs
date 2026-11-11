// Teste de ponta a ponta da Fase 1 (navegador real, Supabase local).
// Pré-requisitos: `npm run db:start`, `npm run db:reset` e o app rodando em
// http://localhost:3000 com APP_USERS=pedro:1234,daniel:1234,antony:1234.
//
// Uso: node scripts/e2e-fase1.mjs [pasta-para-screenshots]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

// Playwright pode estar instalado globalmente (NODE_PATH) ou no projeto.
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const PASS = process.env.E2E_PASSWORD ?? "1234";
const SHOTS = process.argv[2];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err?.message?.split("\n")[0] ?? err}`);
    process.exitCode = 1;
  }
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

const browser = await chromium.launch();

// ---------------------------------------------------------------------------
console.log("Celular");
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const m = await ctx.newPage();
const consoleErrors = [];
m.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));

await step("sem passe, qualquer página leva para a entrada", async () => {
  await m.goto(`${BASE}/financeiro`);
  await m.waitForURL(`${BASE}/entrar`);
  await m.getByRole("heading", { name: "Bem-vindo!" }).waitFor();
  await shot(m, "01-entrada-celular");
});

await step("nome vazio e senha errada mostram mensagem clara, sem apagar o nome", async () => {
  await m.getByRole("button", { name: "Entrar" }).click();
  await m.getByText("Digite seu nome.").waitFor();
  await m.getByLabel("Seu nome").fill("Daniel");
  await m.getByLabel("Sua senha").fill("9999");
  await m.getByRole("button", { name: "Entrar" }).click();
  await m.getByText("Nome ou senha errados.").waitFor();
  assert.equal(await m.getByLabel("Seu nome").inputValue(), "Daniel");
  await shot(m, "02-senha-errada");
});

await step("senha certa libera o celular e abre o início", async () => {
  await m.getByLabel("Sua senha").fill(PASS);
  await m.getByRole("button", { name: "Entrar" }).click();
  await m.waitForURL(`${BASE}/dashboard`);
  await m.getByRole("heading", { level: 1, name: /Daniel!/ }).waitFor();
  await m.getByText("Recebi dinheiro").first().waitFor();
  await shot(m, "03-inicio-celular");
});

await step("continua liberado depois de fechar e abrir o navegador (cookie de longa duração)", async () => {
  const cookies = await ctx.cookies();
  const pass = cookies.find((c) => c.name === "fd_acesso");
  assert.ok(pass && pass.httpOnly, "passe deve ser httpOnly");
  assert.ok(pass.expires * 1000 - Date.now() > 300 * 24 * 3600 * 1000, "passe deve durar mais de 300 dias");
  await m.goto(`${BASE}/entrar`);
  await m.waitForURL(`${BASE}/dashboard`);
});

await step("sem rolagem horizontal", async () => {
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - 390);
  assert.ok(overflow <= 0, `overflow de ${overflow}px`);
});

await step("barra de baixo: Início, Dinheiro, +, Serviços, Menu", async () => {
  const bar = m.getByRole("navigation", { name: "Navegação rápida" });
  const tabs = (await bar.getByRole("link").allInnerTexts()).map((t) => t.trim());
  assert.deepEqual(tabs, ["Início", "Dinheiro", "Serviços"]);
  await bar.getByRole("button", { name: "Adicionar" }).click();
  await m.waitForTimeout(450);
  const sheet = m.getByRole("dialog");
  for (const t of ["Recebi dinheiro", "Paguei uma conta", "Novo cliente", "Novo serviço", "Novo orçamento"]) {
    await sheet.getByText(t).waitFor();
  }
  await shot(m, "04-botao-mais");
  await m.keyboard.press("Escape");
  await m.waitForTimeout(300);
});

await step("menu abre com as 9 áreas", async () => {
  await m.getByRole("navigation", { name: "Navegação rápida" }).getByRole("button", { name: "Menu" }).click();
  await m.waitForTimeout(450);
  const nav = m.getByRole("dialog").getByRole("navigation", { name: "Menu principal" });
  assert.equal(await nav.getByRole("link").count(), 9);
  await shot(m, "05-menu");
  await nav.getByRole("link", { name: /Clientes/ }).click();
  await m.waitForURL(`${BASE}/clientes`);
  await m.getByRole("main").getByText("Em breve").waitFor();
});

await step("busca encontra e abre uma tela", async () => {
  await m.getByRole("button", { name: "Buscar" }).click();
  await m.getByPlaceholder(/O que você procura/).fill("reserva");
  await m.keyboard.press("Enter");
  await m.waitForURL(`${BASE}/fundos`);
});

await step("configurações mostram quem está usando", async () => {
  await m.goto(`${BASE}/configuracoes`);
  await m.getByRole("main").getByText("Daniel", { exact: true }).waitFor();
  await shot(m, "06-configuracoes");
});

await step("tema escuro aplica e persiste", async () => {
  await m.getByRole("radio", { name: "Escuro" }).click();
  await m.goto(`${BASE}/dashboard`);
  assert.ok(await m.locator("html.dark").count());
  await shot(m, "07-inicio-escuro");
  await m.goto(`${BASE}/configuracoes`);
  await m.getByRole("radio", { name: "Claro" }).click();
});

await step("sair deste celular pede confirmação e tira o acesso", async () => {
  await m.getByRole("button", { name: "Sair deste celular" }).click();
  await m.getByRole("dialog").getByRole("button", { name: "Sair", exact: true }).click();
  await m.waitForURL(`${BASE}/entrar`);
  await m.goto(`${BASE}/dashboard`);
  await m.waitForURL(`${BASE}/entrar`);
});

await step("passe falsificado é recusado", async () => {
  await ctx.addCookies([
    { name: "fd_acesso", value: `${Date.now()}.assinatura-falsa`, url: BASE },
    { name: "fd_nome", value: "Daniel", url: BASE },
  ]);
  await m.goto(`${BASE}/dashboard`);
  await m.waitForURL(`${BASE}/entrar`);
});

await step("sem erros no console do navegador", async () => {
  assert.equal(consoleErrors.length, 0, consoleErrors.join("\n"));
});
await ctx.close();

// ---------------------------------------------------------------------------
console.log("\nComputador");
const d = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await step("entrada, menu lateral e ações rápidas no computador", async () => {
  await d.goto(`${BASE}/entrar`);
  await d.getByLabel("Seu nome").fill("Antony");
  await d.getByLabel("Sua senha").fill(PASS);
  await d.getByRole("button", { name: "Entrar" }).click();
  await d.waitForURL(`${BASE}/dashboard`);
  const nav = d.getByRole("navigation", { name: "Menu principal" });
  assert.equal(await nav.getByRole("link").count(), 9);
  await d.getByRole("button", { name: /Novo/ }).click();
  assert.equal(await d.getByRole("menuitem").count(), 5);
  await d.keyboard.press("Escape");
  await shot(d, "08-inicio-computador");
});

await browser.close();
console.log(`\n${passed} verificações passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
