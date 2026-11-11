// Teste de ponta a ponta da Fase 3 (Clientes, Serviços e Orçamentos).
// Pré-requisitos: banco local recém-resetado (`npm run db:reset`) e o app rodando em
// http://localhost:3000 com APP_USERS=pedro:1234,daniel:1234,antony:1234.
//
// Uso: node scripts/e2e-fase3.mjs [pasta-para-screenshots]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

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
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/falha-fase3-${passed}.png` }).catch(() => {});
  }
}
const shot = async (name) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png` });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
p.setDefaultTimeout(8000);
const consoleErrors = [];
p.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));

const sheet = () => p.getByRole("dialog");
const main = () => p.getByRole("main");
const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
let serviceUrl = "";
let budgetUrl = "";

console.log("Preparação");
await step("entra como Pedro e cria uma conta para receber pagamentos", async () => {
  await p.goto(`${BASE}/entrar`);
  await p.getByLabel("Seu nome").fill("pedro");
  await p.getByLabel("Sua senha").fill("1234");
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.waitForURL(`${BASE}/dashboard`);
  await p.goto(`${BASE}/financeiro`);
  await main().getByRole("button", { name: "Criar conta" }).click();
  await sheet().getByLabel("Nome da conta").fill("Conta teste");
  await sheet().getByRole("button", { name: "Criar conta" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Conta teste").waitFor();
});

console.log("\nClientes");
await step("sem clientes: mostra como começar", async () => {
  await p.goto(`${BASE}/clientes`);
  await main().getByText("Nenhum cliente ainda").waitFor();
});

await step("nome é obrigatório e o que foi digitado não some", async () => {
  await main().getByRole("button", { name: "Novo cliente" }).first().click();
  await sheet().getByLabel(/WhatsApp ou telefone/).fill("(11) 91234-5678");
  await sheet().getByRole("button", { name: "Cadastrar cliente" }).click();
  await sheet().getByText("Qual o nome do cliente?").waitFor();
  assert.equal(await sheet().getByLabel(/WhatsApp ou telefone/).inputValue(), "(11) 91234-5678");
});

await step("cadastra a Maria só com o essencial", async () => {
  await sheet().getByLabel("Nome", { exact: true }).fill("Maria Souza");
  await sheet().getByLabel("Endereço").fill("Rua das Flores, 100");
  await sheet().getByLabel("Valor estimado").fill("300");
  await sheet().getByRole("button", { name: "Cadastrar cliente" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Maria Souza").waitFor();
  await main().getByText("(11) 91234-5678").waitFor();
});

await step("telefone repetido avisa de quem é, em vez de duplicar", async () => {
  await main().getByRole("button", { name: "Novo cliente" }).click();
  await sheet().getByLabel("Nome", { exact: true }).fill("Outra Pessoa");
  await sheet().getByLabel(/WhatsApp ou telefone/).fill("11 91234 5678");
  await sheet().getByRole("button", { name: "Cadastrar cliente" }).click();
  await sheet().getByText("Esse número já é do cliente Maria Souza.").waitFor();
  await p.keyboard.press("Escape");
  await sheet().waitFor({ state: "hidden" });
});

await step("cadastra o João sem telefone e a busca/filtro funcionam", async () => {
  await main().getByRole("button", { name: "Novo cliente" }).click();
  await sheet().getByLabel("Nome", { exact: true }).fill("João Pereira");
  await sheet().getByLabel("Situação").selectOption({ label: "Em atendimento" });
  await sheet().getByRole("button", { name: "Cadastrar cliente" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("João Pereira").waitFor();
  await main().getByLabel("Buscar cliente").fill("mari");
  await main().getByText("João Pereira").waitFor({ state: "hidden" });
  await main().getByLabel("Buscar cliente").fill("91234");
  await main().getByText("Maria Souza").waitFor();
  await main().getByLabel("Buscar cliente").fill("");
  await main().getByRole("button", { name: "Em atendimento" }).click();
  await main().getByText("Maria Souza").waitFor({ state: "hidden" });
  await main().getByRole("button", { name: "Todos" }).click();
  await shot("10-clientes");
});

await step("a ficha do cliente mostra os dados e atalhos", async () => {
  await main().getByText("Maria Souza").click();
  await p.waitForURL(/\/clientes\/[0-9a-f-]{36}$/);
  await main().getByRole("heading", { level: 1, name: "Maria Souza" }).waitFor();
  await main().getByText("Rua das Flores, 100").waitFor();
  await main().getByRole("link", { name: /WhatsApp/ }).waitFor();
  assert.match(await main().innerText(), /Valor estimado:\s*R\$\s*300,00/);
  await shot("11-cliente");
});

console.log("\nServiços");
await step("novo serviço pela ficha do cliente já vem com o cliente escolhido", async () => {
  await main().getByRole("link", { name: /Novo serviço/ }).click();
  await p.waitForURL(/\/servicos\?novo=1&cliente=/);
  await sheet().getByLabel("Cliente").waitFor();
  assert.equal(await sheet().getByLabel("Cliente").evaluate((el) => el.selectedOptions[0].textContent), "Maria Souza");
});

await step("cadastra o serviço com dia, hora e valor combinado", async () => {
  await sheet().getByLabel("Que serviço é?").selectOption({ label: "Desentupimento" });
  await sheet().getByLabel("Detalhes").fill("Pia da cozinha entupida");
  await sheet().getByLabel(/^Dia/).fill(hoje);
  await sheet().getByLabel("Hora").fill("14:30");
  await sheet().getByLabel("Valor combinado").fill("300,00");
  await sheet().getByLabel("Quem vai fazer?").fill("Pedro");
  await sheet().getByRole("button", { name: "Anotar serviço" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Maria Souza").waitFor();
  await main().getByText("14:30").waitFor();
  await main().getByText("Agendado").waitFor();
  await main().getByRole("heading", { name: "Hoje" }).waitFor();
  await shot("12-servicos");
});

await step("filtro Hoje mostra o serviço; Concluídos não", async () => {
  await main().getByRole("button", { name: "Hoje" }).click();
  await main().getByText("Maria Souza").waitFor();
  await main().getByRole("button", { name: "Concluídos" }).click();
  await main().getByText("Nenhum serviço nesta lista.").waitFor();
  await main().getByRole("button", { name: "Em aberto" }).click();
  await main().getByText("Maria Souza").click();
  await p.waitForURL(/\/servicos\/[0-9a-f-]{36}$/);
  serviceUrl = p.url();
  await main().getByRole("heading", { level: 1, name: "Desentupimento" }).waitFor();
});

await step("custo vira lucro: material 2 × R$ 15,00 = R$ 30,00", async () => {
  await main().getByRole("button", { name: "Anotar custo" }).click();
  await sheet().getByLabel("O que foi?").fill("Cano de 50mm");
  await sheet().getByLabel("Quantidade").fill("2");
  await sheet().getByLabel("Valor de cada").fill("15,00");
  await sheet().getByRole("button", { name: "Anotar custo" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Cano de 50mm").waitFor();
  const t = await main().innerText();
  assert.match(t, /Custos \(material e mão de obra\)\s*R\$\s*30,00/);
  assert.match(t, /Sobra se receber tudo\s*R\$\s*270,00/);
});

await step("valor do custo inválido mostra mensagem e mantém o texto", async () => {
  await main().getByRole("button", { name: "Anotar custo" }).click();
  await sheet().getByLabel("O que foi?").fill("Luva");
  await sheet().getByLabel("Valor de cada").fill("xx");
  await sheet().getByRole("button", { name: "Anotar custo" }).click();
  await sheet().getByText("Valor inválido. Exemplo: 150,00").waitFor();
  assert.equal(await sheet().getByLabel("O que foi?").inputValue(), "Luva");
  await p.keyboard.press("Escape");
  await sheet().waitFor({ state: "hidden" });
});

await step("concluir o serviço NÃO gera pagamento sozinho", async () => {
  await main().getByRole("button", { name: "Concluir" }).click();
  await main().getByText(/Concluir não registra dinheiro sozinho/).waitFor();
  assert.match(await main().innerText(), /Já recebeu\s*R\$\s*0,00/);
});

await step("receber pagamento de R$ 100,00 vira entrada no financeiro", async () => {
  await main().getByRole("button", { name: "Receber pagamento" }).click();
  assert.equal(await sheet().getByLabel("Quanto?").inputValue(), "300,00"); // sugere o que falta
  await sheet().getByLabel("Quanto?").fill("100");
  // com uma só conta, ela já vem escolhida
  assert.equal(await sheet().getByLabel("Entrou em qual conta?").evaluate((el) => el.selectedOptions[0].textContent), "Conta teste");
  await sheet().getByRole("button", { name: "Anotar pagamento" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText(/Recebido em Conta teste/).waitFor();
  const t = await main().innerText();
  assert.match(t, /Já recebeu\s*R\$\s*100,00/);
  assert.match(t, /Ainda falta cobrar\s*R\$\s*200,00/);
  assert.match(t, /Sobrou até agora\s*R\$\s*70,00/);
  assert.doesNotMatch(t, /Concluir não registra dinheiro sozinho/);
});

await step("o pagamento aparece no Dinheiro e o saldo da conta subiu", async () => {
  await p.goto(`${BASE}/financeiro`);
  await main().getByText(/Pagamento — Desentupimento/).waitFor();
  assert.match(await main().innerText(), /Entrou\s*R\$\s*100,00/);
});

await step("foto antes/depois: envia, mostra e apaga", async () => {
  await p.goto(serviceUrl);
  // PNG 1x1 válido
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const f = "/tmp/foto-teste.png";
  writeFileSync(f, png);
  await main().getByLabel("Escolher foto: Antes").setInputFiles(f);
  await main().getByRole("img", { name: /Antes/ }).waitFor();
  await main().getByRole("button", { name: "Apagar", exact: true }).click();
  await main().getByRole("button", { name: "Sim" }).click();
  await main().getByRole("img", { name: /Antes/ }).waitFor({ state: "detached" });
});

console.log("\nOrçamentos");
await step("novo orçamento: cria e já abre para colocar os itens", async () => {
  await p.goto(`${BASE}/orcamentos`);
  await main().getByText("Nenhum orçamento ainda").waitFor();
  await main().getByRole("button", { name: "Novo orçamento" }).first().click();
  await sheet().getByRole("button", { name: "Criar e adicionar itens" }).click();
  await sheet().getByText("Escolha o cliente.").waitFor();
  await sheet().getByLabel("Cliente").selectOption({ label: "João Pereira" });
  await sheet().getByLabel("Descrição do trabalho").fill("Desentupimento da rede de esgoto");
  await sheet().getByLabel("Desconto").fill("20,00");
  await sheet().getByRole("button", { name: "Criar e adicionar itens" }).click();
  await p.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);
  budgetUrl = p.url();
  await main().getByText(/Orçamento nº 1/).waitFor();
});

await step("itens e totais: 2 × R$ 75,25 + R$ 49,50 − R$ 20,00 = R$ 180,00", async () => {
  await main().getByRole("button", { name: "Adicionar item" }).click();
  await sheet().getByLabel("O que é?").fill("Mão de obra");
  await sheet().getByLabel("Quantidade").fill("2");
  await sheet().getByLabel("Valor de cada").fill("75,25");
  await sheet().getByRole("button", { name: "Adicionar" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByRole("button", { name: "Adicionar item" }).click();
  await sheet().getByLabel("O que é?").fill("Peça de conexão");
  await sheet().getByLabel("Tipo").selectOption({ label: "Material" });
  await sheet().getByLabel("Valor de cada").fill("49,50");
  await sheet().getByRole("button", { name: "Adicionar" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Peça de conexão").waitFor();
  const t = await main().innerText();
  assert.match(t, /Soma dos itens\s*R\$\s*200,00/);
  assert.match(t, /Desconto\s*−\s*R\$\s*20,00/);
  assert.match(t, /Total\s*R\$\s*180,00/);
  await shot("13-orcamento");
});

await step("aprovar não gera dinheiro; transformar em serviço leva ao serviço", async () => {
  await main().getByRole("button", { name: "O cliente aprovou" }).click();
  await main().getByRole("button", { name: "Transformar em serviço" }).waitFor();
  await main().getByRole("button", { name: "Transformar em serviço" }).click();
  await p.waitForURL(/\/servicos\/[0-9a-f-]{36}$/);
  await main().getByRole("heading", { level: 1, name: "Serviço" }).waitFor();
  await main().getByRole("link", { name: /orçamento nº 1/ }).waitFor();
  const t = await main().innerText();
  assert.match(t, /Valor combinado\s*R\$\s*180,00/);
  assert.match(t, /Já recebeu\s*R\$\s*0,00/);
});

await step("o orçamento fica travado e aponta para o serviço", async () => {
  await p.goto(budgetUrl);
  await main().getByRole("link", { name: "Ver o serviço gerado" }).waitFor();
  assert.equal(await main().getByRole("button", { name: "Adicionar item" }).count(), 0);
  await p.goto(`${BASE}/financeiro`);
  assert.match(await main().innerText(), /Entrou\s*R\$\s*100,00/); // continua só o que foi recebido de verdade
});

await step("orçamento passado da validade aparece como vencido", async () => {
  await p.goto(`${BASE}/orcamentos`);
  await main().getByRole("button", { name: "Novo orçamento" }).first().click();
  await sheet().getByLabel("Cliente").selectOption({ label: "Maria Souza" });
  await sheet().getByLabel("Data do orçamento").fill("2026-10-01");
  await sheet().getByLabel("Vale até").fill("2026-10-10");
  await sheet().getByRole("button", { name: "Criar e adicionar itens" }).click();
  await p.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);
  await main().getByText("Vencido", { exact: true }).first().waitFor();
  await p.goto(`${BASE}/orcamentos`);
  await main().getByRole("button", { name: "Recusados e vencidos" }).click();
  await main().getByText(/Maria Souza/).waitFor();
  await main().getByText(/João Pereira/).waitFor({ state: "hidden" });
});

await step("validade antes da data é recusada", async () => {
  await main().getByRole("button", { name: "Novo orçamento" }).first().click();
  await sheet().getByLabel("Cliente").selectOption({ label: "Maria Souza" });
  await sheet().getByLabel("Data do orçamento").fill("2026-10-10");
  await sheet().getByLabel("Vale até").fill("2026-10-01");
  await sheet().getByRole("button", { name: "Criar e adicionar itens" }).click();
  await sheet().getByText("A validade não pode ser antes da data do orçamento.").waitFor();
  await p.keyboard.press("Escape");
});

console.log("\nGeral");
await step("sem rolagem horizontal nas telas novas", async () => {
  for (const path of ["/clientes", "/servicos", "/orcamentos", serviceUrl.replace(BASE, ""), budgetUrl.replace(BASE, "")]) {
    await p.goto(`${BASE}${path}`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - 390);
    assert.ok(overflow <= 0, `${path}: overflow de ${overflow}px`);
  }
});

await step("os atalhos do + abrem os formulários certos", async () => {
  for (const [path, title] of [["/clientes?novo=1", "Novo cliente"], ["/servicos?novo=1", "Novo serviço"], ["/orcamentos?novo=1", "Novo orçamento"]]) {
    await p.goto(`${BASE}${path}`);
    await sheet().getByRole("heading", { name: title }).waitFor();
    await p.keyboard.press("Escape");
    await sheet().waitFor({ state: "hidden" });
  }
});

await step("outra pessoa vê o mesmo (dados no banco, não no navegador) e o histórico registra quem anotou", async () => {
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const q = await ctx2.newPage();
  q.setDefaultTimeout(8000);
  await q.goto(`${BASE}/entrar`);
  await q.getByLabel("Seu nome").fill("antony");
  await q.getByLabel("Sua senha").fill("1234");
  await q.getByRole("button", { name: "Entrar" }).click();
  await q.waitForURL(`${BASE}/dashboard`);
  await q.goto(`${BASE}/clientes`);
  await q.getByRole("main").getByText("Maria Souza").waitFor();
  await ctx2.close();
});

await step("sem erros no console do navegador", async () => {
  assert.equal(consoleErrors.length, 0, consoleErrors.join("\n"));
});

await browser.close();
console.log(`\n${passed} verificações passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
