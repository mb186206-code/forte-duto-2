// Teste de ponta a ponta da Fase 4 (Marketing e anúncios).
// Pré-requisitos: banco local recém-resetado (`npm run db:reset`, espere ~15 s) e o app em
// http://localhost:3000 com APP_USERS=pedro:1234,daniel:1234,antony:1234.
//
// Uso: node scripts/e2e-fase4.mjs [pasta-para-screenshots]
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
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/falha-fase4-${passed}.png` }).catch(() => {});
  }
}
async function marketingText(url = `${BASE}/marketing`) {
  await p.goto(url);
  await main().getByText("Gastou em anúncios").first().waitFor();
  return main().innerText();
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
let campaignUrl = "";

async function newCustomer(name) {
  await p.goto(`${BASE}/clientes?novo=1`);
  await sheet().getByLabel("Nome", { exact: true }).fill(name);
  await sheet().getByRole("button", { name: "Cadastrar cliente" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText(name).waitFor();
}
async function openCustomer(name) {
  await p.goto(`${BASE}/clientes`);
  await main().getByText(name).click();
  await p.waitForURL(/\/clientes\/[0-9a-f-]{36}$/);
}

console.log("Preparação");
await step("entra, cria conta e três clientes", async () => {
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
  for (const n of ["Maria Souza", "João Pereira", "Pedro Alves"]) await newCustomer(n);
});

console.log("\nCampanhas");
await step("sem campanhas: mostra como começar", async () => {
  await p.goto(`${BASE}/marketing`);
  await main().getByText("Nenhuma campanha ainda").waitFor();
});

await step("nome e plataforma são obrigatórios", async () => {
  await main().getByRole("button", { name: "Nova campanha" }).click();
  await sheet().getByRole("button", { name: "Criar campanha" }).click();
  await sheet().getByText("Dê um nome para a campanha.").waitFor();
  await sheet().getByText("Escolha onde o anúncio roda.").waitFor();
  await p.keyboard.press("Escape");
  await sheet().waitFor({ state: "hidden" });
});

await step("cria a campanha do Instagram e abre a página dela", async () => {
  await main().getByRole("button", { name: "Nova campanha" }).click();
  await sheet().getByLabel("Nome da campanha").fill("Desentupimento Instagram");
  await sheet().getByLabel("Onde o anúncio roda?").selectOption({ label: "Instagram" });
  await sheet().getByRole("button", { name: "Criar campanha" }).click();
  await p.waitForURL(/\/marketing\/[0-9a-f-]{36}$/);
  campaignUrl = p.url();
  await main().getByRole("heading", { level: 1, name: "Desentupimento Instagram" }).waitFor();
});

await step("código de link repetido é recusado", async () => {
  await p.goto(`${BASE}/marketing`);
  await main().getByRole("button", { name: "Nova campanha" }).click();
  await sheet().getByLabel("Nome da campanha").fill("Outra campanha");
  await sheet().getByLabel("Onde o anúncio roda?").selectOption({ label: "Google" });
  await sheet().getByLabel(/Código do link/).fill("Desentupimento Instagram");
  await sheet().getByRole("button", { name: "Criar campanha" }).click();
  await sheet().getByText(/Esse código de link já é de outra campanha/).waitFor();
  await p.keyboard.press("Escape");
});

await step("gerador de link: usa o código da campanha e o anúncio escolhido", async () => {
  await p.goto(campaignUrl);
  await main().getByLabel(/Endereço da página de destino/).fill("fortedutodesentupidora.com.br/orcamento");
  const gerado = main().getByLabel("Link gerado");
  await gerado.waitFor();
  let t = await gerado.innerText();
  assert.match(t, /^https:\/\/fortedutodesentupidora\.com\.br\/orcamento\?/);
  assert.match(t, /utm_source=instagram/);
  assert.match(t, /utm_medium=cpc/);
  assert.match(t, /utm_campaign=desentupimento-instagram/);
  assert.doesNotMatch(t, /utm_content/);

  await main().getByRole("button", { name: "Novo anúncio" }).click();
  await sheet().getByLabel("Nome do anúncio").fill("Vídeo da pia entupida");
  await sheet().getByRole("button", { name: "Criar anúncio" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByRole("heading", { name: "Anúncios", exact: true }).waitFor();
  await main().locator("li", { hasText: "Vídeo da pia entupida" }).waitFor();
  await main().getByLabel("De qual anúncio?").selectOption({ label: "Vídeo da pia entupida" });
  t = await gerado.innerText();
  assert.match(t, /utm_content=video-da-pia-entupida/);
});

await step("números: mensagens de erro claras e depois lança R$ 150,00", async () => {
  await main().getByRole("button", { name: "Lançar números" }).click();
  await sheet().getByLabel("Quanto gastou").fill("xx");
  await sheet().getByLabel("Cliques").fill("abc");
  await sheet().getByRole("button", { name: "Lançar", exact: true }).click();
  await sheet().getByText("Valor inválido. Exemplo: 150,00").waitFor();
  await sheet().getByText(/Cliques: digite um número inteiro/).waitFor();
  await sheet().getByLabel("Quanto gastou").fill("150,00");
  await sheet().getByLabel("Cliques").fill("1.200");
  await sheet().getByLabel("Conversas iniciadas").fill("12");
  await sheet().getByRole("button", { name: "Lançar", exact: true }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText(/1\.200 cliques · 12 conversas/).waitFor();
  assert.match(await main().innerText(), /R\$\s*150,00/);
  await shot("20-campanha");
});

await step("o mesmo período não pode ser lançado duas vezes", async () => {
  await main().getByRole("button", { name: "Lançar números" }).click();
  await sheet().getByLabel("Quanto gastou").fill("10");
  await sheet().getByRole("button", { name: "Lançar", exact: true }).click();
  await sheet().getByText(/já lançou números para esse mesmo período/).waitFor();
  await p.keyboard.press("Escape");
});

console.log("\nOrigem dos clientes");
await step("rastreada sem nenhuma evidência é recusada", async () => {
  await openCustomer("Maria Souza");
  await main().getByRole("button", { name: "Informar" }).click();
  await sheet().getByLabel("O que você sabe?").selectOption({ label: "Veio pelo link do anúncio" });
  await sheet().getByRole("button", { name: "Salvar origem" }).click();
  await sheet().getByText(/informe a campanha ou os dados do link/).waitFor();
});

await step("Maria: rastreada pela campanha (o código do link entra sozinho)", async () => {
  await sheet().getByLabel("Qual campanha?").selectOption({ label: "Desentupimento Instagram (Instagram)" });
  await sheet().getByLabel("Qual anúncio?").selectOption({ label: "Vídeo da pia entupida" });
  await sheet().getByRole("button", { name: "Salvar origem" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Rastreada", { exact: true }).waitFor();
  await main().getByText(/utm|campanha desentupimento-instagram/).first().waitFor();
});

await step("João: declarada (só contou); Pedro: desconhecida", async () => {
  await openCustomer("João Pereira");
  await main().getByRole("button", { name: "Informar" }).click();
  await sheet().getByLabel("Qual campanha?").selectOption({ label: "Desentupimento Instagram (Instagram)" });
  await sheet().getByRole("button", { name: "Salvar origem" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Declarada", { exact: true }).waitFor();

  await openCustomer("Pedro Alves");
  await main().getByRole("button", { name: "Informar" }).click();
  await sheet().getByLabel("O que você sabe?").selectOption({ label: "Não sei de onde veio" });
  assert.equal(await sheet().getByLabel("Qual campanha?").count(), 0); // desconhecida não escolhe campanha
  await sheet().getByRole("button", { name: "Salvar origem" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Desconhecida", { exact: true }).waitFor();
});

await step("trocar a origem substitui a anterior (uma só principal)", async () => {
  await main().getByRole("button", { name: "Trocar" }).click();
  await sheet().getByLabel("O que você sabe?").selectOption({ label: "Cliente disse que viu o anúncio" });
  await sheet().getByRole("button", { name: "Salvar origem" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Declarada", { exact: true }).waitFor();
  await main().getByRole("button", { name: "Trocar" }).click();
  await sheet().getByLabel("O que você sabe?").selectOption({ label: "Não sei de onde veio" });
  await sheet().getByRole("button", { name: "Salvar origem" }).click();
  await sheet().waitFor({ state: "hidden" });
  await main().getByText("Desconhecida", { exact: true }).waitFor();
});

console.log("\nResultado dos anúncios");
await step("antes de alguém pagar: 2 contatos, 0 clientes, ROI −100%", async () => {
  const t = await marketingText();
  assert.match(t, /Gastou em anúncios\s*R\$\s*150,00/);
  assert.match(t, /Pessoas que chamaram\s*2/);
  assert.match(t, /Viraram clientes\s*0/);
  assert.match(t, /Custo por contato\s*R\$\s*75,00/);
  assert.match(t, /Custo por cliente\s*—/);
  assert.match(t, /Retorno \(ROI\)[\s\S]*?-100%|Retorno \(ROI\)[\s\S]*?−100%/);
});

await step("Maria paga R$ 400,00: viram 1 cliente, ROI 166,7% e custo por cliente R$ 150,00", async () => {
  await p.goto(`${BASE}/financeiro?novo=entrada`);
  await sheet().getByLabel("Quanto recebeu?").fill("400");
  await sheet().getByLabel("De quê? (serviço ou cliente)").fill("Desentupimento da Maria");
  await sheet().getByLabel(/^Cliente/).selectOption({ label: "Maria Souza" });
  await sheet().getByLabel("Entrou em qual conta?").selectOption({ label: "Conta teste" });
  await sheet().getByRole("button", { name: "Anotar entrada" }).click();
  await sheet().waitFor({ state: "hidden" });
  const t = await marketingText();
  assert.match(t, /Viraram clientes\s*1/);
  assert.match(t, /Pagaram no total\s*R\$\s*400,00/);
  assert.match(t, /Custo por cliente\s*R\$\s*150,00/);
  assert.match(t, /De cada 100 contatos, fecham\s*50%/);
  assert.match(t, /Retorno \(ROI\)[\s\S]*?166,7%/);
  await shot("21-marketing");
});

await step("um pagamento ainda a receber NÃO conta como cliente nem receita", async () => {
  await p.goto(`${BASE}/financeiro?novo=entrada`);
  await sheet().getByLabel("Quanto recebeu?").fill("900");
  await sheet().getByLabel("De quê? (serviço ou cliente)").fill("Orçamento do João");
  await sheet().getByLabel(/^Cliente/).selectOption({ label: "João Pereira" });
  await sheet().getByLabel("Já recebi esse dinheiro").uncheck();
  await sheet().getByRole("button", { name: "Anotar entrada" }).click();
  await sheet().waitFor({ state: "hidden" });
  const t = await marketingText();
  assert.match(t, /Viraram clientes\s*1/);
  assert.match(t, /Pagaram no total\s*R\$\s*400,00/);
});

await step("origem dos clientes novos: 1 rastreada, 1 declarada, 1 desconhecida", async () => {
  const t = await marketingText();
  assert.match(t, /3 cadastrados neste período/);
  assert.match(t, /Rastreada\s*1\s*Declarada\s*1\s*Desconhecida\s*1\s*Sem informação\s*0/);
});

await step("a página da campanha mostra quem veio e quem já pagou", async () => {
  await p.goto(campaignUrl);
  await main().getByText("Pessoas ligadas a esta campanha").waitFor();
  const t = await main().innerText();
  assert.match(t, /Maria Souza/);
  assert.match(t, /João Pereira[\s\S]*Ainda não pagou/);
  assert.match(t, /R\$\s*400,00/);
});

await step("outro mês não mistura números", async () => {
  const t = await marketingText(`${BASE}/marketing?mes=2026-01`);
  assert.match(t, /Gastou em anúncios\s*R\$\s*0,00/);
  assert.match(t, /Pessoas que chamaram\s*0/);
  assert.match(await marketingText(`${BASE}/marketing?mes=tudo`), /Gastou em anúncios\s*R\$\s*150,00/);
});

console.log("\nGeral");
await step("sem rolagem horizontal", async () => {
  for (const path of ["/marketing", campaignUrl.replace(BASE, "")]) {
    await p.goto(`${BASE}${path}`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - 390);
    assert.ok(overflow <= 0, `${path}: overflow de ${overflow}px`);
  }
});

await step("o menu de marketing está liberado e abre a tela certa", async () => {
  await p.goto(`${BASE}/marketing?novo=1`);
  await sheet().getByRole("heading", { name: "Nova campanha" }).waitFor();
});

await step("sem erros no console do navegador", async () => {
  assert.equal(consoleErrors.length, 0, consoleErrors.join("\n"));
});

await browser.close();
console.log(`\n${passed} verificações passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
