// Teste de ponta a ponta da Fase 5 (Relatórios e Configurações).
// Pré-requisitos: banco local recém-resetado (`npm run db:reset`, espere ~15 s) e o app em
// http://localhost:3000 com APP_USERS=pedro:1234,daniel:1234,antony:1234.
//
// Uso: node scripts/e2e-fase5.mjs [pasta-para-screenshots]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const { chromium, request } = createRequire(import.meta.url)("playwright");
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
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/falha-fase5-${passed}.png` }).catch(() => {});
  }
}
const shot = async (name) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
p.setDefaultTimeout(8000);
const consoleErrors = [];
p.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));

const sheet = () => p.getByRole("dialog");
const main = () => p.getByRole("main");
const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
const mes = hoje.slice(0, 7);
const primeiroDia = `${mes}-01`;

async function pageText(url, waitFor) {
  await p.goto(url);
  await main().getByText(waitFor).first().waitFor();
  return main().innerText();
}

async function tx({ kind, amount, desc, category, done = true, date = hoje, account = "Conta teste" }) {
  await p.goto(`${BASE}/financeiro?novo=${kind === "in" ? "entrada" : "despesa"}`);
  await sheet().getByLabel(kind === "in" ? "Quanto recebeu?" : "Quanto pagou?").fill(amount);
  await sheet().getByLabel(kind === "in" ? "De quê? (serviço ou cliente)" : "O que foi?").fill(desc);
  if (!done) await sheet().getByLabel(kind === "in" ? "Já recebi esse dinheiro" : "Já paguei essa conta").uncheck();
  await sheet().locator('input[name="date"]').fill(date);
  if (done) await sheet().locator('select[name="accountId"]').selectOption({ label: account });
  if (category) await sheet().locator('select[name="categoryId"]').selectOption({ label: category });
  await sheet().getByRole("button", { name: kind === "in" ? "Anotar entrada" : "Anotar despesa" }).click();
  await sheet().waitFor({ state: "hidden" });
}

console.log("Preparação");
await step("entra e cria a conta e os lançamentos do mês", async () => {
  await p.goto(`${BASE}/entrar`);
  await p.getByLabel("Seu nome").fill("daniel");
  await p.getByLabel("Sua senha").fill("1234");
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.waitForURL(`${BASE}/dashboard`);
  await p.goto(`${BASE}/financeiro`);
  await main().getByRole("button", { name: "Criar conta" }).click();
  await sheet().getByLabel("Nome da conta").fill("Conta teste");
  await sheet().getByRole("button", { name: "Criar conta" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Conta teste").waitFor();

  await tx({ kind: "in", amount: "1000", desc: "Serviço A", category: "Prestação de serviço" });
  await tx({ kind: "in", amount: "500", desc: "Serviço B", category: "Prestação de serviço", done: false, date: primeiroDia });
  await tx({ kind: "out", amount: "200", desc: "Compra de canos", category: "Materiais" });
  await tx({ kind: "out", amount: "100", desc: "Gasolina", category: "Combustível" });
  await tx({ kind: "out", amount: "300", desc: "Máquina nova", category: "Equipamentos" });
  await tx({ kind: "out", amount: "50", desc: "Taxa", category: "Impostos e taxas", done: false });
});

await step("um serviço concluído com custo (combinado R$ 300,00, custo R$ 100,00)", async () => {
  await p.goto(`${BASE}/clientes?novo=1`);
  await sheet().getByLabel("Nome", { exact: true }).fill("Maria Souza");
  await sheet().getByRole("button", { name: "Cadastrar cliente" }).click();
  await sheet().waitFor({ state: "hidden" });
  await p.goto(`${BASE}/servicos?novo=1`);
  await sheet().getByLabel("Cliente").selectOption({ label: "Maria Souza" });
  await sheet().getByLabel("Que serviço é?").selectOption({ label: "Desentupimento" });
  await sheet().getByLabel("Valor combinado").fill("300");
  await sheet().getByRole("button", { name: "Anotar serviço" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Maria Souza").click();
  await p.waitForURL(/\/servicos\/[0-9a-f-]{36}$/);
  await main().getByRole("button", { name: "Anotar custo" }).click();
  await sheet().getByLabel("O que foi?").fill("Material");
  await sheet().getByLabel("Valor de cada").fill("100");
  await sheet().getByRole("button", { name: "Anotar custo" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByRole("button", { name: "Concluir" }).click();
  await main().getByText(/Concluir não registra dinheiro sozinho/).waitFor();
});

console.log("\nConfigurações");
await step("dados da empresa: nome obrigatório e e-mail válido", async () => {
  await p.goto(`${BASE}/configuracoes`);
  await main().getByLabel("Nome da empresa").fill("");
  await main().getByLabel("E-mail").fill("isso-nao-e-email");
  await main().getByRole("button", { name: "Salvar dados da empresa" }).click();
  await main().getByText("Qual o nome da empresa?").waitFor();
  await main().getByText(/E-mail inválido/).waitFor();
  assert.equal(await main().getByLabel("E-mail").inputValue(), "isso-nao-e-email");
});

await step("salva dados e metas e continuam ali depois de recarregar", async () => {
  await main().getByLabel("Nome da empresa").fill("Forte Duto Desentupidora");
  await main().getByLabel("E-mail").fill("contato@forteduto.com.br");
  await main().getByLabel("Meta de faturamento do mês").fill("3.000,00");
  await main().getByLabel("Meta de lucro do mês").fill("2300");
  await main().getByRole("button", { name: "Salvar dados da empresa" }).click();
  await p.getByText("Dados da empresa salvos.").waitFor();
  await p.reload();
  assert.equal(await main().getByLabel("Nome da empresa").inputValue(), "Forte Duto Desentupidora");
  assert.equal(await main().getByLabel("Meta de faturamento do mês").inputValue(), "3000,00");
  await shot("30-configuracoes");
});

await step("novo tipo de despesa; nome repetido é recusado", async () => {
  await main().getByRole("button", { name: "Adicionar" }).first().click();
  await sheet().getByLabel("Nome").fill("Pneu");
  await sheet().getByLabel("Como entra no resultado?").selectOption({ label: "Investimento" });
  await sheet().getByRole("button", { name: "Adicionar", exact: true }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Pneu", { exact: true }).waitFor();
  await main().getByRole("button", { name: "Adicionar" }).first().click();
  await sheet().getByLabel("Nome").fill("pneu");
  await sheet().getByRole("button", { name: "Adicionar", exact: true }).click();
  await sheet().getByText("Já existe um item com esse nome.").waitFor();
  await p.keyboard.press("Escape");
});

await step("esconder um tipo tira ele das listas do dinheiro; mostrar de volta traz", async () => {
  await main().getByRole("button", { name: "Esconder Pneu" }).click();
  await main().getByRole("button", { name: "Mostrar Pneu" }).waitFor();
  await p.goto(`${BASE}/financeiro?novo=despesa`);
  await sheet().locator('select[name="categoryId"]').waitFor();
  assert.equal(await sheet().locator('select[name="categoryId"] option', { hasText: "Pneu" }).count(), 0);
  await p.keyboard.press("Escape");
  await p.goto(`${BASE}/configuracoes`);
  await main().getByRole("button", { name: "Mostrar Pneu" }).click();
  await main().getByRole("button", { name: "Esconder Pneu" }).waitFor();
  await p.goto(`${BASE}/financeiro?novo=despesa`);
  await sheet().locator('select[name="categoryId"]').waitFor();
  assert.equal(await sheet().locator('select[name="categoryId"] option', { hasText: "Pneu" }).count(), 1);
  await p.keyboard.press("Escape");
});

await step("origem de cliente: cria 'Panfleto' como não-anúncio", async () => {
  await p.goto(`${BASE}/configuracoes`);
  const botoes = main().getByRole("button", { name: "Adicionar" });
  await botoes.last().click();
  await sheet().getByLabel("Nome").fill("Panfleto");
  await sheet().getByRole("button", { name: "Adicionar", exact: true }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Panfleto", { exact: true }).waitFor();
});

console.log("\nRelatórios");
await step("faturamento e resultado do mês batem com os lançamentos", async () => {
  const t = await pageText(`${BASE}/relatorios`, "Faturamento (vendido no mês)");
  assert.match(t, /Faturamento \(vendido no mês\)\s*R\$\s*1\.500,00/);
  assert.match(t, /já recebido\s*R\$\s*1\.000,00/);
  assert.match(t, /ainda a receber\s*R\$\s*500,00/);
  assert.match(t, /Custos do serviço\s*R\$\s*200,00/);
  assert.match(t, /Despesas da empresa\s*R\$\s*100,00/);
  assert.match(t, /Impostos e taxas\s*R\$\s*50,00/);
  assert.match(t, /Resultado do mês \(lucro\)\s*R\$\s*1\.150,00/);
  assert.match(t, /Investimentos do mês:\s*R\$\s*300,00/);
  await shot("31-relatorio");
});

await step("metas: 50% do faturamento e 50% do lucro", async () => {
  const t = await main().innerText();
  assert.match(t, /Meta de faturamento:\s*50%\s*atingida/);
  assert.match(t, /Meta de lucro:\s*50%\s*atingida/);
});

await step("fluxo de caixa: entrou 1.000, saiu 600 (inclui o equipamento), sobrou 400", async () => {
  const t = await main().innerText();
  assert.match(t, /Entrou\s*R\$\s*1\.000,00/);
  assert.match(t, /Saiu\s*R\$\s*600,00/);
  assert.match(t, /Sobrou no caixa\s*R\$\s*400,00/);
});

await step("despesas por tipo aparecem com a classificação", async () => {
  const t = await main().innerText();
  assert.match(t, /Equipamentos[\s\S]*Investimentos \(compra de equipamentos\)/);
  assert.match(t, /Materiais[\s\S]*Custos do serviço \(material, mão de obra\)/);
});

await step("serviços: 1 concluído no mês, sobra R$ 200,00", async () => {
  const t = await main().innerText();
  assert.match(t, /Concluídos no mês\s*1/);
  assert.match(t, /Desentupimento\s*× 1/);
  assert.match(t, /Sobra dos serviços\s*R\$\s*200,00/);
});

await step("pendências: a receber 500, a pagar 50, e 1 em atraso", async () => {
  const t = await main().innerText();
  assert.match(t, /A receber\s*R\$\s*500,00/);
  assert.match(t, /A pagar\s*R\$\s*50,00/);
  assert.match(t, /1 em atraso/);
  assert.match(t, /Serviço B/);
});

await step("fundos e evolução aparecem", async () => {
  const t = await main().innerText();
  assert.match(t, /Total guardado\s*R\$\s*0,00/);
  await main().getByRole("img", { name: /Gráfico de entradas e saídas/ }).waitFor();
});

await step("outro mês não mistura valores", async () => {
  const t = await pageText(`${BASE}/relatorios?mes=2026-01`, "Faturamento (vendido no mês)");
  assert.match(t, /Faturamento \(vendido no mês\)\s*R\$\s*0,00/);
  assert.match(t, /Resultado do mês \(lucro\)\s*R\$\s*0,00/);
  assert.match(t, /Nenhuma despesa neste mês/);
});

await step("planilha de lançamentos baixa em CSV com acentos e valores certos", async () => {
  const r = await ctx.request.get(`${BASE}/relatorios/exportar?tipo=lancamentos&mes=${mes}`);
  assert.equal(r.status(), 200);
  assert.match(r.headers()["content-type"], /text\/csv/);
  assert.match(r.headers()["content-disposition"], /forte-duto-lancamentos-/);
  const body = await r.text();
  assert.ok(body.startsWith("\uFEFF"), "precisa do BOM para o Excel");
  assert.match(body, /Serviço A;?/);
  assert.match(body, /Prestação de serviço/);
  assert.match(body, /;1000,00\r?\n/);
  assert.match(body, /Máquina nova/);
});

await step("outras planilhas funcionam e tipo inválido é recusado", async () => {
  for (const t of ["servicos", "clientes", "orcamentos"]) {
    const r = await ctx.request.get(`${BASE}/relatorios/exportar?tipo=${t}&mes=${mes}`);
    assert.equal(r.status(), 200, t);
  }
  assert.match(await (await ctx.request.get(`${BASE}/relatorios/exportar?tipo=servicos&mes=${mes}`)).text(), /Maria Souza/);
  assert.equal((await ctx.request.get(`${BASE}/relatorios/exportar?tipo=xx&mes=${mes}`)).status(), 400);
});

await step("quem não entrou não baixa nada (planilha nem cópia dos dados)", async () => {
  const anon = await request.newContext({ baseURL: BASE });
  for (const path of [`/relatorios/exportar?tipo=lancamentos&mes=${mes}`, "/configuracoes/backup"]) {
    const r = await anon.get(path, { maxRedirects: 0 });
    assert.ok(r.status() >= 300 && r.status() < 400, `${path}: status ${r.status()}`);
    assert.match(r.headers().location ?? "", /\/entrar/);
  }
  await anon.dispose();
});

await step("cópia dos dados traz todas as tabelas com o que foi cadastrado", async () => {
  const r = await ctx.request.get(`${BASE}/configuracoes/backup`);
  assert.equal(r.status(), 200);
  assert.match(r.headers()["content-disposition"], /forte-duto-copia-/);
  const j = await r.json();
  assert.equal(j.gerado_por, "Daniel");
  assert.equal(j.tabelas.customers.length, 1);
  assert.equal(j.tabelas.transactions.length, 6);
  assert.equal(j.tabelas.company_settings[0].company_name, "Forte Duto Desentupidora");
});

console.log("\nHistórico");
await step("histórico mostra quem fez o quê, e o filtro funciona", async () => {
  await p.goto(`${BASE}/configuracoes/historico`);
  await main().getByText(/daniel/i).first().waitFor();
  const t = await main().innerText();
  assert.match(t, /criou: lançamento/);
  assert.match(t, /criou: cliente/);
  assert.match(t, /alterou: dados da empresa/);
  await main().getByRole("link", { name: "clientes" }).click();
  await p.waitForURL(/tabela=customers/);
  const f = await main().innerText();
  assert.doesNotMatch(f, /lançamento/);
  assert.match(f, /cliente/);
});

console.log("\nGeral");
await step("sem rolagem horizontal", async () => {
  for (const path of ["/relatorios", "/configuracoes", "/configuracoes/historico"]) {
    await p.goto(`${BASE}${path}`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - 390);
    assert.ok(overflow <= 0, `${path}: overflow de ${overflow}px`);
  }
});

await step("sem erros no console do navegador", async () => {
  assert.equal(consoleErrors.length, 0, consoleErrors.join("\n"));
});

await browser.close();
console.log(`\n${passed} verificações passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
