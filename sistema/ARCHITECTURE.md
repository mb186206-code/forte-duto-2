# Arquitetura

## Visão geral

```
Celular ──► proxy.ts (sem passe ou sem nome → /entrar)
        ──► Server Components / Server Actions (validação com Zod)
        ──► Supabase com a chave secreta (só no servidor) ──► PostgreSQL
```

Não há login (pedido do Daniel: o sistema é só dele e da equipe). A proteção é:

1. **Código da empresa** (`APP_ACCESS_CODE`): digitado uma vez por celular. Vira um cookie
   `fd_acesso` httpOnly, assinado com HMAC (`APP_SESSION_SECRET`), válido por 400 dias. A assinatura
   inclui o código, então trocar o código desconecta todos. Código errado tem espera de 0,8 s.
2. **Banco fechado**: o navegador nunca recebe chave do Supabase. RLS forçado sem políticas e
   privilégios revogados de `anon`/`authenticated`; só o servidor (service_role) acessa.
3. **Nome de quem usa** (cookie `fd_nome`) vai no cabeçalho `x-app-user`; o banco grava esse nome
   no histórico (`audit_logs`) e em `created_by`.

## Pastas

```
sistema/
├─ src/
│  ├─ proxy.ts                    # (antigo middleware) confere passe e nome; senão → /entrar
│  ├─ app/
│  │  ├─ entrar/                  # boas-vindas: nome + código da empresa
│  │  ├─ (app)/                   # sistema: barra de baixo (celular), menu lateral (computador)
│  │  └─ configuracao-pendente/   # tela quando faltam as variáveis do Supabase
│  ├─ components/
│  │  ├─ ui/                      # primitivos (padrão shadcn/ui sobre Radix)
│  │  ├─ layout/                  # sidebar, topbar, busca global, ações rápidas, navegação
│  │  ├─ forms/                   # campos e hooks de formulário reutilizáveis
│  │  ├─ shared/                  # PageHeader, EmptyState, ModuleComingSoon
│  │  └─ brand/                   # logo
│  ├─ features/<módulo>/actions.ts # Server Actions (regras de negócio + escrita)
│  └─ lib/
│     ├─ supabase/                # cliente do servidor (chave secreta), env, tipos gerados
│     ├─ access/                  # passe do celular (HMAC), configuração, nome de quem usa
│     ├─ validation/              # esquemas Zod (mensagens em português)
│     └─ money.ts                 # dinheiro em centavos inteiros
├─ supabase/
│  ├─ migrations/                 # SQL versionado (fonte da verdade do banco)
│  └─ config.toml                 # Supabase local
└─ scripts/                       # testes de banco e ponta a ponta
```

Regra de dependência: `app` → `features` → `lib`. Componentes de `ui` não conhecem regras de negócio.

## Decisões

| Decisão | Motivo |
|---|---|
| Next.js 16 **sem** Cache Components | Toda tela depende de dados atuais; renderização sob demanda é mais simples e segura. |
| Sem login; código da empresa + nome | Pedido do Daniel: uso simples no celular, só ele e a equipe. |
| Banco acessado **só pelo servidor** | Sem usuários no Supabase, RLS por pessoa não faz sentido; fechar o banco para o navegador é mais seguro. |
| Dinheiro em **centavos inteiros** no código, `numeric(14,2)` no banco | Evita erro de ponto flutuante (0,10 + 0,20 = 0,30 exato). Conversão só nas bordas (`toDbAmount`/`fromDbAmount`). |
| Cálculos de saldo em **views SQL** (`account_balances`, `fund_balances`, `financial_position`) | Uma única fonte da verdade. |
| Regras críticas no banco (constraints, triggers) | Transferência sem destino, valor ≤ 0, retirada maior que o fundo, cliente duplicado: o banco recusa, independentemente da tela. |
| Formulários com `useFormAction` (submit via transição) | O reset automático de formulários do React 19 apagaria o que a pessoa digitou quando há erro de validação. |
| Celular primeiro | Barra de baixo com Início, Dinheiro, **+**, Serviços e Menu; ações em linguagem do dia a dia. |

## Skiper UI e shadcn/ui

O prompt pede Skiper UI como referência. O site skiper-ui.com e o registro do shadcn ficaram
inacessíveis a partir do ambiente de desenvolvimento (bloqueio de rede), então os componentes foram
escritos no padrão do shadcn/ui (Radix + Tailwind + `cva`), que é a mesma base do Skiper UI.
Componentes do Skiper podem ser adicionados depois com `npx shadcn add <url>` sem reescrever nada;
as animações usam `motion`, a mesma biblioteca que o Skiper usa. Verifique a licença de cada
componente do Skiper antes de usar (há componentes gratuitos e "Pro").

## Integrações futuras

Meta Ads, Google Ads e WhatsApp Business **não estão implementados**. O banco já está preparado:
`campaign_metrics.source` (`manual` | `meta_ads` | `google_ads`), `campaigns.external_id`,
`advertisements.external_id` e `customer_attributions` (UTM, gclid/fbclid). As credenciais
necessárias estão listadas e comentadas em `.env.example`.
