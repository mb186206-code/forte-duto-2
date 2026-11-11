# Arquitetura

## Visão geral

```
Navegador ──► proxy.ts (renova sessão, bloqueia quem não está logado)
          ──► Server Components / Server Actions (requireUser / requireModule)
          ──► Supabase (PostgREST + Auth) ──► PostgreSQL com RLS (última barreira)
```

Três camadas de proteção, da mais fraca para a mais forte:

1. **Interface** (`lib/auth/permissions.ts`): esconde do menu o que a função não usa.
2. **Servidor** (`lib/auth/session.ts`): cada página chama `requireModule()`; cada Server Action
   chama `requireUser()` e valida os dados com Zod.
3. **Banco** (RLS): mesmo que alguém chame a API direto com o token, só lê/escreve o que a função
   permite. Esta é a proteção que vale.

## Pastas

```
sistema/
├─ src/
│  ├─ proxy.ts                    # (antigo middleware) sessão + redirecionamento para login
│  ├─ app/
│  │  ├─ (auth)/                  # login, recuperar-senha, redefinir-senha (layout com a marca)
│  │  ├─ (app)/                   # área logada: sidebar + topbar; um diretório por módulo
│  │  ├─ auth/confirm/route.ts    # destino dos links de e-mail (token_hash ou code)
│  │  ├─ auth/sair/route.ts       # encerra sessão de usuário desativado
│  │  └─ configuracao-pendente/   # tela quando faltam as variáveis do Supabase
│  ├─ components/
│  │  ├─ ui/                      # primitivos (padrão shadcn/ui sobre Radix)
│  │  ├─ layout/                  # sidebar, topbar, busca global, ações rápidas, navegação
│  │  ├─ forms/                   # campos e hooks de formulário reutilizáveis
│  │  ├─ shared/                  # PageHeader, EmptyState, ModuleComingSoon
│  │  └─ brand/                   # logo
│  ├─ features/<módulo>/actions.ts # Server Actions (regras de negócio + escrita)
│  └─ lib/
│     ├─ supabase/                # clientes (browser, server, proxy), env, tipos gerados
│     ├─ auth/                    # sessão (DAL), permissões, rotas públicas
│     ├─ validation/              # esquemas Zod (mensagens em português)
│     └─ money.ts                 # dinheiro em centavos inteiros
├─ supabase/
│  ├─ migrations/                 # SQL versionado (fonte da verdade do banco)
│  ├─ templates/                  # e-mails em português
│  └─ config.toml                 # Supabase local
└─ scripts/                       # testes de banco e ponta a ponta
```

Regra de dependência: `app` → `features` → `lib`. Componentes de `ui` não conhecem regras de negócio.

## Decisões

| Decisão | Motivo |
|---|---|
| Next.js 16 **sem** Cache Components | Toda tela depende do usuário e de dados atuais; renderização sob demanda é mais simples e segura. |
| `proxy.ts` usa `getClaims()`; páginas usam `getUser()` | O proxy é rápido; a página valida o token no servidor de Auth antes de mostrar dados. |
| Dinheiro em **centavos inteiros** no código, `numeric(14,2)` no banco | Evita erro de ponto flutuante (0,10 + 0,20 = 0,30 exato). Conversão só nas bordas (`toDbAmount`/`fromDbAmount`). |
| Cálculos de saldo em **views SQL** (`account_balances`, `fund_balances`, `financial_position`) | Uma única fonte da verdade, respeitando RLS (`security_invoker`). |
| Regras críticas no banco (constraints, triggers) | Transferência sem destino, valor ≤ 0, retirada maior que o fundo, cliente duplicado: o banco recusa, independentemente da tela. |
| Formulários com `useFormAction` (submit via transição) | O reset automático de formulários do React 19 apagaria o que a pessoa digitou quando há erro de validação. |
| Primeiro usuário vira admin; cadastro público desligado | Sistema interno: ninguém se cadastra sozinho. |
| `SUPABASE_SECRET_KEY` só em código de servidor (Fase 5) | Nunca no navegador. As chaves públicas dependem do RLS. |

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
