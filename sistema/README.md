# Forte Duto Gestão

Sistema web de gestão empresarial, financeira, comercial e de marketing da **Forte Duto**.
Funciona no navegador do computador e do celular.

> Este diretório (`sistema/`) é independente do site institucional que fica na raiz do repositório.
> Nada do site foi alterado.

## Situação atual

**Fase 1 concluída** — base do sistema, pensada para o celular: entrada sem login (nome + código da
empresa, uma vez por celular), barra de baixo com o botão **+**, menu com os 9 módulos, busca,
tema claro/escuro, identidade visual e o **banco de dados completo** (todas as tabelas, regras
financeiras e histórico de alterações com o nome de quem fez).

Os módulos das próximas fases aparecem com a etiqueta "Em breve". Nenhum botão finge funcionar e
nenhum dado é fictício. Plano completo em [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · componentes no padrão shadcn/ui
(Radix) · Lucide · Recharts · Motion · Supabase (PostgreSQL, Storage) · Vercel.

## Como funciona o acesso (sem login)

- Na primeira vez, cada pessoa digita **o nome** e o **código da empresa** (`APP_ACCESS_CODE`).
  O celular fica liberado por 400 dias (cookie assinado, que o JavaScript da página não lê).
- O nome aparece no histórico de alterações e no campo "criado por" de cada registro.
- Só o servidor fala com o banco, usando a chave secreta. A chave pública do Supabase não lê nada.
- Para tirar o acesso de todo mundo, troque o código (ou o `APP_SESSION_SECRET`) na Vercel.

## Colocar no ar (produção)

1. **Criar o projeto no Supabase** (plano gratuito serve): <https://supabase.com/dashboard> → *New project*.
   Região sugerida: São Paulo (`sa-east-1`).
2. **Criar o banco**: no painel do Supabase, *SQL Editor*, rode os arquivos de
   `supabase/migrations/` **na ordem** (001 → 004). Ou, com a CLI:
   `npx supabase link --project-ref SEU_REF && npx supabase db push`.
3. **Publicar na Vercel**: projeto com **Root Directory = `sistema`** e as variáveis de
   `.env.example` (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_ACCESS_CODE`, `APP_SESSION_SECRET`).

Se o sistema for publicado sem as variáveis do banco, ele mostra a tela "O banco de dados ainda não
foi conectado" em vez de quebrar.

## Desenvolvimento local

Requisitos: Node 20.9+, Docker (para o Supabase local).

```bash
cd sistema
npm install
npm run db:start            # sobe Supabase local (Postgres, Storage)
npm run db:reset            # aplica as migrações do zero
cp .env.example .env.local  # SUPABASE_URL e SUPABASE_SECRET_KEY de `npx supabase status`
npm run dev                 # http://localhost:3000
```

## Testes

| Comando | O que testa |
|---|---|
| `npm run check` | TypeScript + ESLint + testes unitários (dinheiro em centavos, validações, passe do celular) |
| `npm run test:db` | 22 testes no Supabase **local**: chave pública sem acesso, saldos, transferências, fundos, orçamento→serviço, histórico com o nome de quem fez. Requer `.env.test` (veja `.env.test.example`) e banco recém-resetado |
| `node scripts/e2e-fase1.mjs [pasta]` | 14 verificações no navegador (Playwright), no celular e no computador: entrada, código errado, barra de baixo, botão +, menu, busca, nome, tema, sair, passe falsificado. Requer app rodando com `APP_ACCESS_CODE=246810` |

## Documentação

- [ARCHITECTURE.md](ARCHITECTURE.md) — organização do código e decisões técnicas
- [DATABASE.md](DATABASE.md) — modelo de dados, regras financeiras e acesso
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — cores, tipografia e componentes
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — fases e status
