// Teste de ponta a ponta da Fase 1 (navegador real, Supabase local).
// Pré-requisitos: `npm run db:start`, `npm run db:reset`, app rodando em
// http://localhost:3000 e os usuários de teste criados (veja README, seção Testes).
//
// Uso: node scripts/e2e-fase1.mjs [pasta-para-screenshots]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

// Playwright pode estar instalado globalmente (NODE_PATH) ou no projeto.
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";
const SHOTS = process.argv[2];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const ADMIN = { email: "admin@teste.local", password: "Teste1234" };
const OP = { email: "op@teste.local", password: "Teste1234" };

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
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

const browser = await chromium.launch();

async function login(page, { email, password }) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

// ---------------------------------------------------------------------------
console.log("Desktop — administrador");
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));

await step("rota protegida sem login vai para o login", async () => {
  await page.goto(`${BASE}/financeiro`);
  await page.waitForURL(/\/login\?next=%2Ffinanceiro/);
  await shot(page, "01-login-desktop");
});

await step("senha errada mostra mensagem clara", async () => {
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Senha", { exact: true }).fill("errada123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("E-mail ou senha incorretos").waitFor();
  assert.equal(await page.getByLabel("E-mail").inputValue(), ADMIN.email, "o e-mail digitado não pode sumir");
  await shot(page, "02-login-erro");
});

await step("e-mail inválido é validado antes de enviar", async () => {
  await page.getByLabel("E-mail").fill("daniel");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("E-mail inválido").waitFor();
});

await step("login correto volta para a página pedida (?next)", async () => {
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Senha", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${BASE}/financeiro`);
  await page.getByRole("heading", { name: "Financeiro", level: 1 }).waitFor();
});

await step("dashboard mostra saudação, banco conectado e função", async () => {
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole("heading", { level: 1, name: /Daniel!/ }).waitFor();
  await page.getByText("Conectado").waitFor();
  await page.getByText("Administrador").first().waitFor();
  await shot(page, "03-dashboard-desktop");
});

await step("menu lateral tem os 9 módulos e marca a página atual", async () => {
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  const links = await nav.getByRole("link").allInnerTexts();
  assert.equal(links.length, 9, links.join(" | "));
  await nav.getByRole("link", { name: /Clientes/ }).click();
  await page.waitForURL(`${BASE}/clientes`);
  assert.equal(await nav.getByRole("link", { name: /Clientes/ }).getAttribute("aria-current"), "page");
  await shot(page, "04-modulo-clientes");
});

await step("ações rápidas listam as 5 ações (desativadas até a fase delas)", async () => {
  await page.getByRole("button", { name: /Novo/ }).click();
  const items = page.getByRole("menuitem");
  assert.equal(await items.count(), 5);
  assert.equal(await page.getByRole("menuitem", { name: /Nova despesa/ }).getAttribute("aria-disabled"), "true");
  await shot(page, "05-acoes-rapidas");
  await page.keyboard.press("Escape");
});

await step("busca global (Ctrl+K) encontra e abre uma tela", async () => {
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder(/O que você procura/).fill("reserva");
  await shot(page, "06-busca-global");
  await page.keyboard.press("Enter");
  await page.waitForURL(`${BASE}/fundos`);
});

await step("perfil: salvar nome e telefone", async () => {
  await page.goto(`${BASE}/configuracoes`);
  await page.getByLabel("Nome").fill("Daniel Forte");
  await page.getByLabel(/Telefone/).fill("123");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await page.getByText("Telefone incompleto").waitFor();
  await page.getByLabel(/Telefone/).fill("(21) 98711-4521");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await page.getByText("Perfil atualizado.").waitFor();
  await page.reload();
  assert.equal(await page.getByLabel("Nome").inputValue(), "Daniel Forte");
});

await step("admin vê a equipe com as funções", async () => {
  await page.getByText("Equipe e permissões").waitFor();
  await page.getByText("op@teste.local").waitFor();
  await shot(page, "07-configuracoes");
});

await step("tema escuro aplica e persiste", async () => {
  await page.getByRole("radio", { name: "Escuro" }).click();
  await page.reload();
  assert.ok(await page.locator("html.dark").count());
  await page.goto(`${BASE}/dashboard`);
  await shot(page, "08-dashboard-escuro");
  await page.goto(`${BASE}/configuracoes`);
  await page.getByRole("radio", { name: "Claro" }).click();
});

await step("trocar senha: validação e sucesso", async () => {
  await page.getByLabel("Nova senha", { exact: true }).fill("curta");
  await page.getByLabel("Repita a nova senha").fill("curta");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await page.getByText("pelo menos 8 caracteres").first().waitFor();
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha2026");
  await page.getByLabel("Repita a nova senha").fill("NovaSenha2026");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await page.getByText("Senha alterada com sucesso.").waitFor();
});

await step("sair encerra a sessão e protege as páginas", async () => {
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.waitForURL(/\/login\?motivo=saiu/);
  await page.getByText("Você saiu do sistema").waitFor();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForURL(/\/login/);
});

await step("nova senha funciona no login", async () => {
  await login(page, { email: ADMIN.email, password: "NovaSenha2026" });
  await page.waitForURL(`${BASE}/dashboard`);
});

await step("usuário logado que abre /login volta ao dashboard", async () => {
  await page.goto(`${BASE}/login`);
  await page.waitForURL(`${BASE}/dashboard`);
});

await step("redirecionamento externo após login é bloqueado", async () => {
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.waitForURL(/\/login/);
  await page.goto(`${BASE}/login?next=//site-malicioso.com`);
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Senha", { exact: true }).fill("NovaSenha2026");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${BASE}/dashboard`);
});

await step("sem erros no console do navegador", async () => {
  const relevant = consoleErrors.filter((e) => !/Failed to load resource: the server responded with a status of 400/.test(e));
  assert.equal(relevant.length, 0, relevant.join("\n"));
});
await ctx.close();

// ---------------------------------------------------------------------------
console.log("\nRecuperação de senha (e-mail)");
await step("pedido de recuperação, link do e-mail e nova senha", async () => {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
  const c = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/login`);
  await p.getByRole("link", { name: "Esqueci minha senha" }).click();
  await p.getByLabel("E-mail cadastrado").fill(OP.email);
  await p.getByRole("button", { name: "Enviar link" }).click();
  await p.getByText("Se este e-mail estiver cadastrado").waitFor();
  await shot(p, "09-recuperar-senha");

  let link;
  for (let i = 0; i < 20 && !link; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const list = await (await fetch(`${MAILPIT}/api/v1/messages`)).json();
    const msg = list.messages?.find((m) => m.To?.some((t) => t.Address === OP.email));
    if (msg) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
      assert.match(full.Subject, /criar nova senha/);
      link = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(full.HTML)?.[1]?.replaceAll("&amp;", "&");
    }
  }
  assert.ok(link, "e-mail de recuperação não chegou");
  assert.match(link, /token_hash=.+&type=recovery/);
  await p.goto(link);
  await p.waitForURL(`${BASE}/redefinir-senha`);
  await shot(p, "10-redefinir-senha");
  await p.getByLabel("Nova senha", { exact: true }).fill("Recuperada2026");
  await p.getByLabel("Repita a nova senha").fill("Recuperada2026");
  await p.getByRole("button", { name: "Salvar e entrar" }).click();
  await p.waitForURL(`${BASE}/dashboard`);

  // o mesmo link não pode ser reutilizado
  const c2 = await browser.newContext();
  const p2 = await c2.newPage();
  await p2.goto(link);
  await p2.waitForURL(/motivo=link-invalido/);
  await c.close();
  await c2.close();
});

// ---------------------------------------------------------------------------
console.log("\nCelular — operacional");
const mob = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const m = await mob.newPage();

await step("login no celular", async () => {
  await m.goto(`${BASE}/login`);
  await shot(m, "11-login-celular");
  await login(m, { email: OP.email, password: "Recuperada2026" });
  await m.waitForURL(`${BASE}/dashboard`);
  await shot(m, "12-dashboard-celular");
});

await step("sem rolagem horizontal no celular", async () => {
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - 390);
  assert.ok(overflow <= 0, `overflow de ${overflow}px`);
});

await step("menu do celular abre e mostra só os módulos do operacional", async () => {
  await m.getByRole("button", { name: "Abrir menu" }).click();
  await m.waitForTimeout(450); // fim da animação da gaveta
  const nav = m.getByRole("dialog").getByRole("navigation", { name: "Menu principal" });
  const labels = (await nav.getByRole("link").allInnerTexts()).map((t) => t.split("\n")[0].trim());
  assert.deepEqual(labels, ["Dashboard", "Clientes", "Serviços", "Orçamentos", "Configurações"]);
  await shot(m, "13-menu-celular");
  await nav.getByRole("link", { name: /Serviços/ }).click();
  await m.waitForURL(`${BASE}/servicos`);
});

await step("operacional que abre /financeiro vê 'sem permissão'", async () => {
  await m.goto(`${BASE}/financeiro`);
  await m.waitForURL(/\/sem-permissao\?modulo=financeiro/);
  await m.getByText("Você não tem acesso a esta área").waitFor();
  await shot(m, "14-sem-permissao-celular");
});

await step("operacional não vê a lista da equipe nas configurações", async () => {
  await m.goto(`${BASE}/configuracoes`);
  await m.getByRole("heading", { name: "Configurações" }).waitFor();
  assert.equal(await m.getByText("Equipe e permissões").count(), 0);
});
await mob.close();

await browser.close();
console.log(`\n${passed} verificações passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
