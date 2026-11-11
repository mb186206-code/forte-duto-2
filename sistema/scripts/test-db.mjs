// Testes de integração do banco (RLS, regras financeiras, triggers).
// Rodam contra o Supabase LOCAL (npx supabase start). Nunca rode contra produção:
// o script cria usuários e registros de teste e apaga o banco local antes.
//
// Uso:  npx supabase db reset && npm run test:db
// O sistema não tem login: só o servidor acessa o banco (chave secreta).
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.SUPABASE_TEST_ANON_KEY;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_KEY;

if (!ANON || !SERVICE) {
  console.error("Defina SUPABASE_TEST_ANON_KEY e SUPABASE_TEST_SERVICE_KEY (veja `npx supabase status`).");
  process.exit(1);
}
if (!/127\.0\.0\.1|localhost/.test(URL)) {
  console.error("Por segurança, este teste só roda contra o Supabase local.");
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(URL, SERVICE, opts);
const anon = createClient(URL, ANON, opts);

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err?.message ?? err}`);
    process.exitCode = 1;
  }
}

const ok = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

// O servidor do sistema envia o nome de quem está usando em "x-app-user".
const asUser = (name) =>
  createClient(URL, SERVICE, { ...opts, global: { headers: { "x-app-user": name } } });
const fin = { client: asUser("Daniel") };
const op = { client: asUser("Carlos") };

const TABLES = [
  "company_settings", "expense_categories", "revenue_categories", "payment_methods", "service_types",
  "customer_sources", "accounts", "transactions", "funds", "fund_movements", "campaigns", "advertisements",
  "campaign_metrics", "customers", "customer_attributions", "budgets", "budget_items", "services",
  "service_items", "attachments", "audit_logs",
];
const VIEWS = ["account_balances", "fund_balances", "financial_position", "budget_totals", "service_costs"];

console.log("Acesso público bloqueado (chave do navegador não acessa nada)");
await test("chave pública não lê nenhuma tabela nem view", async () => {
  for (const t of [...TABLES, ...VIEWS]) {
    const { data, error } = await anon.from(t).select("*").limit(1);
    assert.ok(error || (data ?? []).length === 0, `chave pública leu ${t}`);
    if (!error) assert.fail(`${t} deveria negar acesso, não só voltar vazio`);
  }
});

await test("chave pública não grava nem executa funções", async () => {
  const { error } = await anon.from("customers").insert({ name: "Invasor" });
  assert.ok(error);
  const { error: e2 } = await anon.rpc("convert_budget_to_service", { p_budget_id: "00000000-0000-0000-0000-000000000000" });
  assert.ok(e2);
  const rows = ok(await service.from("customers").select("id").eq("name", "Invasor"));
  assert.equal(rows.length, 0);
});

await test("bucket de anexos é privado", async () => {
  const { data } = await anon.storage.from("anexos").list();
  assert.equal((data ?? []).length, 0);
  const b = ok(await service.storage.getBucket("anexos"));
  assert.equal(b.public, false);
});

console.log("\nFinanceiro: saldos, transferências e fundos");
let acc1, acc2;
await test("financeiro cria contas", async () => {
  acc1 = ok(await fin.client.from("accounts").insert({ name: "Banco Teste", type: "banco", opening_balance: 1000, opening_date: "2026-01-01" }).select().single());
  acc2 = ok(await fin.client.from("accounts").insert({ name: "Caixa Teste", type: "caixa", opening_balance: 0, opening_date: "2026-01-01" }).select().single());
});


const cat = async (table, name) => ok(await fin.client.from(table).select("id").eq("name", name).single()).id;

await test("lança receita recebida, despesa paga, despesa pendente e transferência", async () => {
  const servico = await cat("revenue_categories", "Prestação de serviço");
  const materiais = await cat("expense_categories", "Materiais");
  ok(await fin.client.from("transactions").insert([
    { kind: "receita", status: "efetivado", description: "Serviço A", amount: "500.10", competence_date: "2026-11-01", settled_date: "2026-11-01", account_id: acc1.id, revenue_category_id: servico },
    { kind: "receita", status: "pendente", description: "Serviço B (a receber)", amount: "0.20", competence_date: "2026-11-02", due_date: "2026-11-20", account_id: acc1.id, revenue_category_id: servico },
    { kind: "receita", status: "efetivado", description: "Troco", amount: "0.10", competence_date: "2026-11-02", settled_date: "2026-11-02", account_id: acc2.id, revenue_category_id: servico },
    { kind: "despesa", status: "efetivado", description: "Canos", amount: "200.05", competence_date: "2026-11-03", settled_date: "2026-11-03", account_id: acc1.id, expense_category_id: materiais },
    { kind: "despesa", status: "pendente", description: "Conexões", amount: "99.99", competence_date: "2026-11-03", due_date: "2026-11-15", expense_category_id: materiais },
    { kind: "despesa", status: "cancelado", description: "Compra cancelada", amount: "1000", competence_date: "2026-11-03", expense_category_id: materiais },
    { kind: "transferencia", status: "efetivado", description: "Saque para o caixa", amount: "300", competence_date: "2026-11-04", settled_date: "2026-11-04", account_id: acc1.id, to_account_id: acc2.id },
    // antes da data de abertura: já está dentro do saldo inicial, não pode contar de novo
    { kind: "receita", status: "efetivado", description: "Antiga", amount: "999", competence_date: "2025-12-31", settled_date: "2025-12-31", account_id: acc1.id, revenue_category_id: servico },
  ]));
});

await test("saldos das contas corretos (centavos exatos, transferência não vira receita/despesa)", async () => {
  const rows = ok(await fin.client.from("account_balances").select("name, balance"));
  const b = Object.fromEntries(rows.map((r) => [r.name, String(r.balance)]));
  // 1000 + 500.10 − 200.05 − 300 = 1000.05 ; 0 + 0.10 + 300 = 300.10
  assert.equal(Number(b["Banco Teste"]).toFixed(2), "1000.05");
  assert.equal(Number(b["Caixa Teste"]).toFixed(2), "300.10");
});

await test("transferência sem conta de destino é recusada", async () => {
  const { error } = await fin.client.from("transactions").insert({ kind: "transferencia", status: "efetivado", description: "x", amount: 10, settled_date: "2026-11-05", account_id: acc1.id });
  assert.ok(error);
});

await test("transferência para a mesma conta é recusada", async () => {
  const { error } = await fin.client.from("transactions").insert({ kind: "transferencia", status: "efetivado", description: "x", amount: 10, settled_date: "2026-11-05", account_id: acc1.id, to_account_id: acc1.id });
  assert.ok(error);
});

await test("valor zero ou negativo é recusado", async () => {
  const { error } = await fin.client.from("transactions").insert({ kind: "despesa", description: "x", amount: 0 });
  assert.ok(error);
  const { error: e2 } = await fin.client.from("transactions").insert({ kind: "despesa", description: "x", amount: -5 });
  assert.ok(e2);
});

await test("pagamento efetivado sem data é recusado", async () => {
  const { error } = await fin.client.from("transactions").insert({ kind: "despesa", status: "efetivado", description: "x", amount: 5, account_id: acc1.id });
  assert.ok(error);
});

let fundId;
await test("depósito em fundo reserva dinheiro sem alterar saldo das contas", async () => {
  fundId = ok(await fin.client.from("funds").select("id").eq("name", "Reserva de emergência").single()).id;
  ok(await fin.client.from("fund_movements").insert({ fund_id: fundId, kind: "deposito", amount: "250.00", movement_date: "2026-11-05" }));
  const pos = ok(await fin.client.from("financial_position").select("*").single());
  assert.equal(Number(pos.available_balance).toFixed(2), "1300.15");
  assert.equal(Number(pos.reserved_balance).toFixed(2), "250.00");
  assert.equal(Number(pos.free_balance).toFixed(2), "1050.15");
  assert.equal(Number(pos.receivable).toFixed(2), "0.20");
  assert.equal(Number(pos.payable).toFixed(2), "99.99");
});

await test("retirada maior que o saldo do fundo é recusada", async () => {
  const { error } = await fin.client.from("fund_movements").insert({ fund_id: fundId, kind: "retirada", amount: "250.01" });
  assert.ok(error);
  assert.match(error.message, /maior que o saldo/);
});

await test("percentual da meta do fundo", async () => {
  ok(await fin.client.from("funds").update({ target_amount: 1000 }).eq("id", fundId));
  const f = ok(await fin.client.from("fund_balances").select("balance, target_percent").eq("id", fundId).single());
  assert.equal(Number(f.target_percent), 25);
});


console.log("\nComercial: clientes, orçamentos e serviços");
let customer;
await test("operacional cadastra cliente com dados incompletos", async () => {
  customer = ok(await op.client.from("customers").insert({ name: "Maria Teste", whatsapp: "(21) 99999-0000" }).select().single());
  assert.equal(customer.phone_digits, "21999990000");
});

await test("cliente duplicado pelo mesmo WhatsApp é recusado", async () => {
  const { error } = await op.client.from("customers").insert({ name: "Maria Outra", phone: "21 99999-0000" });
  assert.ok(error);
});

let budget;
await test("orçamento recebe número automático e total calculado", async () => {
  budget = ok(await op.client.from("budgets").insert({ customer_id: customer.id, description: "Desentupir pia", discount: "10.00" }).select().single());
  assert.ok(budget.number >= 1);
  ok(await op.client.from("budget_items").insert([
    { budget_id: budget.id, kind: "material", description: "Sifão", quantity: 3, unit_price: "33.33" },
    { budget_id: budget.id, kind: "mao_de_obra", description: "Mão de obra", quantity: 1, unit_price: "150.00" },
  ]));
  const t = ok(await op.client.from("budget_totals").select("*").eq("budget_id", budget.id).single());
  assert.equal(Number(t.materials_total).toFixed(2), "99.99");
  assert.equal(Number(t.total).toFixed(2), "239.99");
});

await test("orçamento não aprovado não vira serviço", async () => {
  const { error } = await op.client.rpc("convert_budget_to_service", { p_budget_id: budget.id });
  assert.ok(error);
});

await test("orçamento aprovado vira serviço com um clique (uma única vez)", async () => {
  ok(await op.client.from("budgets").update({ status: "aprovado" }).eq("id", budget.id));
  const serviceId = ok(await op.client.rpc("convert_budget_to_service", { p_budget_id: budget.id }));
  const s = ok(await op.client.from("services").select("*").eq("id", serviceId).single());
  assert.equal(s.customer_id, customer.id);
  assert.equal(Number(s.contract_value).toFixed(2), "239.99");
  const { error } = await op.client.rpc("convert_budget_to_service", { p_budget_id: budget.id });
  assert.ok(error, "segunda conversão deveria falhar");
});

await test("orçamento aprovado NÃO gera dinheiro recebido", async () => {
  const pos = ok(await fin.client.from("financial_position").select("*").single());
  assert.equal(Number(pos.available_balance).toFixed(2), "1300.15");
});

console.log("\nMarketing e atribuição");
await test("atribuição 'rastreada' exige evidência (UTM ou click id)", async () => {
  const camp = ok(await fin.client.from("campaigns").insert({ name: "Teste Insta", platform: "instagram_ads", utm_campaign: "teste-insta" }).select().single());
  const { error } = await op.client.from("customer_attributions").insert({ customer_id: customer.id, campaign_id: camp.id, attribution_type: "rastreada" });
  assert.ok(error);
  ok(await op.client.from("customer_attributions").insert({ customer_id: customer.id, campaign_id: camp.id, attribution_type: "rastreada", utm_source: "instagram", utm_campaign: "teste-insta" }));
});


console.log("\nAuditoria");
await test("cada alteração fica no histórico com o nome de quem fez", async () => {
  const logs = ok(await service.from("audit_logs").select("table_name, action, changed_by").eq("table_name", "transactions"));
  assert.ok(logs.length >= 8);
  assert.ok(logs.every((l) => l.changed_by === "Daniel"));
  const custLogs = ok(await service.from("audit_logs").select("changed_by").eq("table_name", "customers"));
  assert.ok(custLogs.some((l) => l.changed_by === "Carlos"));
});

await test("histórico não pode ser alterado nem apagado", async () => {
  const one = ok(await service.from("audit_logs").select("id").limit(1).single());
  const { error } = await service.from("audit_logs").update({ changed_by: "outro" }).eq("id", one.id);
  assert.ok(error);
  const { error: e2 } = await service.from("audit_logs").delete().eq("id", one.id);
  assert.ok(e2);
});

console.log(`\n${passed} testes passaram${process.exitCode ? " — HÁ FALHAS" : ""}.`);
