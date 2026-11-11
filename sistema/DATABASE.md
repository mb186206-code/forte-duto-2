# Banco de dados

PostgreSQL no Supabase. Fonte da verdade: `supabase/migrations/` (4 arquivos, aplicados em ordem).
Tipos TypeScript gerados em `src/lib/supabase/database.types.ts` (`npm run db:types`).

## Convenções

- Dinheiro: `numeric(14,2)`, sempre positivo nas movimentações (o tipo diz se entra ou sai).
- Datas de negócio: `date`; momentos de sistema: `timestamptz`.
- Toda tabela de negócio tem `created_at`, `updated_at` (trigger) e, quando faz sentido, `created_by`.
- Toda tabela de negócio tem **RLS ligado e forçado** e trigger de **auditoria**.
- Nomes de categorias, contas, fundos etc. são únicos sem diferenciar maiúsculas.

## Tabelas

### Usuários e sistema
| Tabela | Conteúdo |
|---|---|
| `auth.users` | Usuários (gerenciada pelo Supabase Auth). **É a tabela "users"** — não existe cópia. |
| `profiles` | 1:1 com `auth.users`: nome, e-mail, telefone, `role` (admin/financeiro/operacional), `active`. Criado por trigger; o 1º usuário vira admin. |
| `audit_logs` | Histórico de alterações (tabela, registro, ação, dados antes/depois, quem, quando). Só admin lê; ninguém escreve direto. |
| `company_settings` | Linha única: dados da empresa e metas mensais. |

### Cadastros auxiliares (editáveis em Configurações)
`expense_categories` (com `classification`: custo_direto, despesa_operacional, investimento, imposto) ·
`revenue_categories` · `payment_methods` · `service_types` · `customer_sources` (com `is_paid_ads`).
Vêm preenchidas com as listas pedidas (12 categorias de despesa, 8 origens, 6 formas de pagamento,
6 tipos de serviço). São listas de configuração, não registros fictícios.

### Financeiro
| Tabela | Conteúdo |
|---|---|
| `accounts` | Contas reais: banco, caixa, carteira digital. `opening_balance` na `opening_date`. |
| `transactions` | Entradas (`receita`), despesas (`despesa`) e **transferências internas** (`transferencia`). |
| `funds` | Fundos/reservas: nome, descrição, meta, prazo, conta onde o dinheiro fica (opcional). 5 fundos iniciais. |
| `fund_movements` | Depósitos e retiradas de cada fundo. |

`transactions` em detalhe:

| Campo | Significado |
|---|---|
| `kind` | `receita` · `despesa` · `transferencia` |
| `status` | `pendente` (previsto / a pagar) · `efetivado` (recebido / pago) · `cancelado` (ignorado em tudo) |
| `competence_date` | Data do fato → faturamento e resultado do período |
| `due_date` | Vencimento → contas a pagar/receber e alertas |
| `settled_date` | Data em que o dinheiro entrou/saiu → saldo e fluxo de caixa |
| `account_id` | Conta de destino (receita), conta usada (despesa) ou origem (transferência) |
| `to_account_id` | Só transferência: conta de destino |
| `customer_id`, `service_id`, `campaign_id`, `supplier` | Relacionamentos |

Restrições no banco: valor > 0; `efetivado` exige data e conta; receita não tem categoria de
despesa; transferência exige duas contas diferentes, não tem categoria nem cliente e não pode ficar
pendente.

### Comercial
| Tabela | Conteúdo |
|---|---|
| `customers` | Só `name` é obrigatório. `phone_digits` (gerado) impede duplicar o mesmo telefone/WhatsApp. `source_id` = origem **declarada**. |
| `budgets` | `number` automático; status aguardando/aprovado/recusado/expirado; desconto; `service_id` quando vira serviço. |
| `budget_items` | Itens (material, mão de obra, outro) com `total = round(qtd × preço, 2)` gerado. |
| `services` | Cliente, tipo, endereço, responsável, datas, `contract_value`, status (6 situações). |
| `service_items` | **Custos reais** do serviço (material, mão de obra). |

`convert_budget_to_service(budget_id)`: numa única transação, exige orçamento aprovado e ainda não
convertido, cria o serviço com o valor total e liga os dois. Itens do orçamento são **preço de
venda** e continuam ligados via `budgets.service_id`; não viram custo.

### Marketing
| Tabela | Conteúdo |
|---|---|
| `campaigns` | Nome, plataforma, status, serviço divulgado, datas, orçamento previsto, ID externo, `utm_campaign` único. |
| `advertisements` | Anúncios da campanha, com `utm_content`. |
| `campaign_metrics` | Números da plataforma por período: alcance, impressões, cliques, conversas, **investimento (`spend`)**. `source` prepara importação automática. |
| `customer_attributions` | Liga cliente ↔ campanha com o **tipo de evidência**: `declarada` (cliente disse), `rastreada` (UTM/gclid/fbclid — o banco exige a evidência), `desconhecida` (não pode ter campanha). |

Contatos qualificados, orçamentos enviados, serviços fechados e receita atribuída **não são
digitados**: são calculados a partir das atribuições (Fase 4), evitando números inventados.

### Anexos
`attachments` (comprovantes, fotos antes/depois) + bucket privado `anexos` no Storage
(caminho `<entidade>/<id>/<arquivo>`, até 20 MB, imagens e PDF). Comprovantes de movimentações
só para admin/financeiro.

## Views de cálculo (respeitam o RLS de quem consulta)

| View | Fórmula |
|---|---|
| `account_balances` | saldo = saldo inicial + receitas efetivadas − despesas efetivadas + transferências recebidas − enviadas (só movimentos com `settled_date ≥ opening_date`) |
| `fund_balances` | saldo = depósitos − retiradas; `target_percent` = saldo ÷ meta × 100 |
| `financial_position` | saldo disponível (contas), saldo reservado (fundos), **dinheiro livre = disponível − reservado**, a receber, a pagar |
| `budget_totals` | materiais, mão de obra, outros, subtotal, desconto, total |
| `service_costs` | custo de material, mão de obra, outros e total do serviço |

## Regras financeiras (garantidas pelo modelo)

- **Transferência** entre contas não é receita nem despesa: não entra em faturamento nem resultado.
- **Fundo** não é conta: depositar num fundo não é despesa e não muda o saldo bancário; muda só o dinheiro livre. Retirada maior que o saldo do fundo é recusada.
- **Orçamento aprovado** não é dinheiro recebido. **Serviço concluído** não é pagamento recebido: o recebimento é uma `transaction` do tipo receita.
- **Cancelado** não entra em nenhum cálculo.
- Faturamento = receitas por `competence_date` (não canceladas). Receita recebida = receitas `efetivado` por `settled_date`. Resultado operacional = receitas reconhecidas − custos diretos − despesas operacionais − impostos do período (investimentos aparecem à parte). Implementado na Fase 2.

## Permissões (RLS)

| Área | Administrador | Financeiro | Operacional |
|---|---|---|---|
| Contas, movimentações, fundos | tudo | ler, criar, editar | — |
| Categorias, formas de pagamento | tudo | ler, criar, editar | ler |
| Tipos de serviço, origens, empresa | tudo | ler | ler |
| Clientes, atribuições | tudo | ler, criar, editar | ler, criar, editar |
| Orçamentos, serviços | tudo | ler | ler, criar, editar |
| Itens de orçamento/serviço | tudo | ler | tudo |
| Campanhas, anúncios | tudo | ler, criar, editar | ler |
| Métricas de campanha (investimento) | tudo | ler, criar, editar | — |
| Perfis | tudo | ler; editar o próprio nome/telefone | idem |
| Histórico de alterações | ler | — | — |
| **Excluir** registros principais | sim | não | não |

Usuário desativado (`active = false`) e visitante anônimo não acessam nada. Só admin muda função,
situação ou e-mail; o último administrador ativo não pode ser rebaixado nem desativado.

Todas as regras acima têm teste automatizado em `scripts/test-db.mjs`.
