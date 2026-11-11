// Teste de ponta a ponta da Fase 2 (Dinheiro, contas, fundos e início).
// Pré-requisitos: banco local recém-resetado (`npm run db:reset`) e o app rodando em
// http://localhost:3000 com APP_USERS=pedro:1234,daniel:1234,antony:1234.
//
// Uso: node scripts/e2e-fase2.mjs [pasta-para-screenshots]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
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
    if (SHOTS && globalThis.__page) await globalThis.__page.screenshot({ path: `${SHOTS}/falha-${passed}.png` }).catch(() => {});
  }
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
globalThis.__page = p;
p.setDefaultTimeout(8000);
const consoleErrors = [];
p.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));

const sheet = () => p.getByRole("dialog");
const main = () => p.getByRole("main");

console.log("Entrada");
await step("entra como Daniel", async () => {
  await p.goto(`${BASE}/entrar`);
  await p.getByLabel("Seu nome").fill("daniel");
  await p.getByLabel("Sua senha").fill("1234");
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.waitForURL(`${BASE}/dashboard`);
  await p.getByRole("heading", { level: 1, name: /Daniel!/ }).waitFor();
});

console.log("\nDinheiro");
await step("sem conta: pede para criar a primeira e mostra tudo zerado", async () => {
  await p.goto(`${BASE}/financeiro`);
  await main().getByText("Comece criando sua primeira conta").waitFor();
  await main().getByText("Livre para usar").waitFor();
  await shot(p, "01-sem-conta");
});

await step("cria duas contas com saldo inicial", async () => {
  await main().getByRole("button", { name: "Criar conta" }).click();
  await sheet().getByLabel("Nome da conta").fill("Nubank");
  await sheet().getByLabel(/Quanto tem nela hoje/).fill("1.000,00");
  await sheet().getByRole("button", { name: "Criar conta" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Nubank").waitFor();
  await main().getByRole("button", { name: "Nova conta" }).click();
  await sheet().getByLabel("Nome da conta").fill("Caixa da empresa");
  await sheet().getByLabel("Que tipo de conta é?").selectOption("caixa");
  await sheet().getByRole("button", { name: "Criar conta" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Caixa da empresa").waitFor();
  assert.match(await main().innerText(), /R\$\s*1\.000,00/);
});

await step("conta com nome repetido é recusada com mensagem clara", async () => {
  await main().getByRole("button", { name: "Nova conta" }).click();
  await sheet().getByLabel("Nome da conta").fill("nubank");
  await sheet().getByRole("button", { name: "Criar conta" }).click();
  await sheet().getByText("Já existe uma conta com esse nome.").waitFor();
  await p.keyboard.press("Escape");
  await sheet().waitFor({ state: "hidden" });
});

await step("valor inválido e conta faltando mostram mensagens, sem apagar o que foi digitado", async () => {
  await main().getByRole("button", { name: "Recebi dinheiro" }).click();
  await sheet().getByLabel("De quê? (serviço ou cliente)").fill("Desentupimento da Maria");
  await sheet().getByLabel("Quanto recebeu?").fill("abc");
  await sheet().getByRole("button", { name: "Anotar entrada" }).click();
  await sheet().getByText("Valor inválido. Exemplo: 150,00").waitFor();
  await sheet().getByText("Em que conta o dinheiro entrou?").waitFor();
  assert.equal(await sheet().getByLabel("De quê? (serviço ou cliente)").inputValue(), "Desentupimento da Maria");
  await shot(p, "02-erros-formulario");
});

await step("anota uma entrada recebida (R$ 350,50) e o saldo muda", async () => {
  await sheet().getByLabel("Quanto recebeu?").fill("350,50");
  await sheet().getByLabel("Entrou em qual conta?").selectOption({ label: "Nubank" });
  await sheet().getByLabel("Tipo").selectOption({ label: "Prestação de serviço" });
  await sheet().getByLabel("Como foi pago?").selectOption({ label: "Pix" });
  await sheet().getByRole("button", { name: "Anotar entrada" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Desentupimento da Maria").waitFor();
  const text = await main().innerText();
  assert.match(text, /R\$\s*1\.350,50/); // 1.000,00 + 350,50 nas contas
});

await step("anota uma despesa paga (R$ 120,00) e uma conta a pagar (R$ 80,00)", async () => {
  await main().getByRole("button", { name: "Paguei uma conta" }).click();
  await sheet().getByLabel("O que foi?").fill("Compra de material");
  await sheet().getByLabel("Quanto pagou?").fill("120");
  await sheet().getByLabel("Saiu de qual conta?").selectOption({ label: "Nubank" });
  await sheet().getByRole("button", { name: "Anotar despesa" }).click();
  await sheet().waitFor({ state: "hidden" });

  await main().getByRole("button", { name: "Paguei uma conta" }).click();
  await sheet().getByLabel("O que foi?").fill("Conta de luz");
  await sheet().getByLabel("Quanto pagou?").fill("80,00");
  await sheet().getByText("Já paguei essa conta").click(); // desmarca: fica pendente
  await sheet().getByRole("button", { name: "Anotar despesa" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Conta de luz").waitFor();
  const text = await main().innerText();
  assert.match(text, /R\$\s*1\.230,50/); // 1.350,50 − 120,00 (a conta de luz ainda não saiu)
  await shot(p, "03-lista");
});

await step("resumo do mês: entrou, saiu e sobrou só com o que foi efetivado", async () => {
  const summary = main().locator("div.grid-cols-3").first();
  const t = await summary.innerText();
  assert.match(t, /Entrou\s*R\$\s*350,50/);
  assert.match(t, /Saiu\s*R\$\s*120,00/);
  assert.match(t, /Sobrou\s*R\$\s*230,50/);
  assert.match(await main().innerText(), /R\$\s*80,00\s*a pagar/);
});

await step("filtros e busca", async () => {
  await main().getByRole("tab", { name: "Pendentes" }).click();
  assert.equal(await main().getByText("Compra de material").count(), 0);
  await main().getByText("Conta de luz").first().waitFor();
  await main().getByRole("tab", { name: "Tudo" }).click();
  await main().getByLabel("Procurar lançamento").fill("maria");
  assert.equal(await main().getByText("Conta de luz").count(), 0);
  await main().getByText("Desentupimento da Maria").waitFor();
  await main().getByLabel("Procurar lançamento").fill("");
});

await step("marca a conta de luz como paga e o saldo diminui", async () => {
  await main().getByText("Conta de luz").first().click();
  await sheet().getByText("A pagar").first().waitFor();
  await sheet().getByLabel("Em qual conta?").selectOption({ label: "Nubank" });
  await sheet().getByRole("button", { name: "Marcar como pago" }).click();
  await sheet().waitFor({ state: "hidden" });
  await p.waitForTimeout(500);
  assert.match(await main().innerText(), /R\$\s*1\.150,50/); // 1.230,50 − 80,00
});

await step("passa dinheiro entre contas sem mexer em entradas e saídas", async () => {
  await main().getByRole("button", { name: "Passar dinheiro" }).click();
  await sheet().getByLabel("Quanto?").fill("200");
  await sheet().getByLabel("Sai de qual conta?").selectOption({ label: "Nubank" });
  await sheet().getByLabel("Vai para qual conta?").selectOption({ label: "Caixa da empresa" });
  await sheet().getByRole("button", { name: "Passar dinheiro" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Transferência entre contas").waitFor();
  const t = await main().innerText();
  assert.match(t, /R\$\s*1\.150,50/); // total nas contas não muda
  assert.match(t, /Sobrou\s*R\$\s*150,50/); // 350,50 − 120 − 80
});

await step("transferir para a mesma conta é recusado", async () => {
  await main().getByRole("button", { name: "Passar dinheiro" }).click();
  await sheet().getByLabel("Quanto?").fill("10");
  await sheet().getByLabel("Sai de qual conta?").selectOption({ label: "Nubank" });
  await sheet().getByLabel("Vai para qual conta?").selectOption({ label: "Nubank" });
  await sheet().getByRole("button", { name: "Passar dinheiro" }).click();
  await sheet().getByText("Escolha duas contas diferentes.").waitFor();
  await p.keyboard.press("Escape");
  await sheet().waitFor({ state: "hidden" });
});

await step("cancelar tira o lançamento dos cálculos", async () => {
  await main().getByText("Compra de material").first().click();
  await sheet().getByRole("button", { name: /Cancelar \(não conta/ }).click();
  await sheet().waitFor({ state: "hidden" });
  await p.waitForTimeout(500);
  assert.match(await main().innerText(), /R\$\s*1\.270,50/); // a compra de 120 volta ao saldo
});

await step("apagar pede confirmação", async () => {
  await main().getByText("Compra de material").first().click();
  await sheet().getByRole("button", { name: "Apagar" }).click();
  await sheet().getByText("Apagar de vez?").waitFor();
  await sheet().getByRole("button", { name: "Sim, apagar" }).click();
  await sheet().waitFor({ state: "hidden" });
  await p.waitForTimeout(400);
  assert.equal(await main().getByText("Compra de material").count(), 0);
});

console.log("\nFundos");
await step("fundos de emergência já vêm criados; guardar dinheiro reduz o livre, não as contas", async () => {
  await p.goto(`${BASE}/fundos`);
  await main().getByText("Reserva de emergência").waitFor();
  await main().getByRole("button", { name: "Guardar" }).first().click();
  await sheet().getByLabel("Quanto?").fill("300");
  await sheet().getByRole("button", { name: "Guardar dinheiro" }).click();
  await sheet().waitFor({ state: "hidden" });
  await p.waitForTimeout(500);
  const t = await main().innerText();
  assert.match(t, /Livre para usar\s*R\$\s*970,50/); // 1.270,50 − 300
  assert.match(t, /Nas contas\s*R\$\s*1\.270,50/);
  assert.match(t, /Guardado nos fundos\s*R\$\s*300,00/);
  await shot(p, "04-fundos");
});

await step("retirar mais do que tem no fundo é recusado", async () => {
  await main().getByRole("button", { name: "Tirar" }).first().click();
  await sheet().getByLabel("Quanto?").fill("500");
  await sheet().getByRole("button", { name: "Tirar dinheiro" }).click();
  await sheet().getByText("Esse valor é maior do que tem guardado no fundo.").waitFor();
  await sheet().getByLabel("Quanto?").fill("100");
  await sheet().getByRole("button", { name: "Tirar dinheiro" }).click();
  await sheet().waitFor({ state: "hidden" });
  await p.waitForTimeout(500);
  assert.match(await main().innerText(), /Guardado nos fundos\s*R\$\s*200,00/);
});

await step("cria um fundo novo com meta e mostra o progresso", async () => {
  await main().getByRole("button", { name: "Novo fundo" }).click();
  await sheet().getByLabel("Nome do fundo").fill("Troca do caminhão");
  await sheet().getByLabel("Meta").fill("1000");
  await sheet().getByRole("button", { name: "Criar fundo" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Troca do caminhão").waitFor();
  await main().getByText(/Meta R\$\s*1\.000,00/).waitFor();
});

console.log("\nInício");
await step("início mostra o resumo, o gráfico e os últimos lançamentos", async () => {
  await p.goto(`${BASE}/dashboard`);
  await main().getByText("Livre para usar").waitFor();
  await main().getByText("Últimos lançamentos").waitFor();
  await main().getByRole("img", { name: /Gráfico de entradas e saídas/ }).waitFor();
  const t = await main().innerText();
  assert.match(t, /Entrou\s*R\$\s*350,50/);
  assert.match(t, /Desentupimento da Maria/);
  await shot(p, "05-inicio");
});

await step("sem rolagem horizontal nas telas novas", async () => {
  for (const path of ["/dashboard", "/financeiro", "/fundos"]) {
    await p.goto(`${BASE}${path}`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - 390);
    assert.ok(overflow <= 0, `${path}: overflow de ${overflow}px`);
  }
});

await step("o botão + abre o formulário certo", async () => {
  await p.goto(`${BASE}/dashboard`);
  await p.getByRole("navigation", { name: "Navegação rápida" }).getByRole("button", { name: "Adicionar" }).click();
  await p.waitForTimeout(450);
  await p.getByRole("dialog").getByText("Paguei uma conta").click();
  await p.waitForURL(/\/financeiro\?novo=despesa/);
  await sheet().getByRole("heading", { name: "Paguei uma conta" }).waitFor();
  await p.keyboard.press("Escape");
});

await step("sem erros no console do navegador", async () => {
  assert.equal(consoleErrors.length, 0, consoleErrors.join("\n"));
});

await browser.close();
console.log(`\n${passed} verificações passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
