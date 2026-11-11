# Forte Duto Gestão

Sistema web de gestão empresarial, financeira, comercial e de marketing da **Forte Duto**.
Funciona no navegador do computador e do celular.

> Este diretório (`sistema/`) é independente do site institucional que fica na raiz do repositório.
> Nada do site foi alterado.

## Situação atual

**Fase 1 concluída** — base do sistema: login, recuperação de senha, perfil, menu lateral com os 9
módulos, busca global, ações rápidas, tema claro/escuro, identidade visual e o **banco de dados
completo** (todas as tabelas, regras financeiras, permissões por função e histórico de alterações).

Os módulos das próximas fases aparecem no menu com a etiqueta da fase e uma tela que explica o que
virá. Nenhum botão finge funcionar e nenhum dado é fictício. Plano completo em
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · componentes no padrão shadcn/ui
(Radix) · Lucide · Recharts · Motion · Supabase (PostgreSQL, Auth, Storage) · Vercel.

## Colocar no ar (produção)

1. **Criar o projeto no Supabase** (plano gratuito serve): <https://supabase.com/dashboard> → *New project*.
   Região sugerida: São Paulo (`sa-east-1`).
2. **Criar o banco**: no painel do Supabase, *SQL Editor*, rode os arquivos de
   `supabase/migrations/` **na ordem** (001 → 004). Ou, com a CLI:
   `npx supabase link --project-ref SEU_REF && npx supabase db push`.
3. **Autenticação** (*Authentication* no painel):
   - *Sign In / Providers → Email*: desligue **"Allow new users to sign up"** (só o administrador cria usuários).
   - *URL Configuration*: `Site URL` = endereço do sistema (ex.: `https://gestao.forteduto.com.br`);
     em *Redirect URLs* adicione `https://SEU-ENDERECO/**`.
   - *Emails → Templates*: em **Reset password** e **Invite user** cole o conteúdo de
     `supabase/templates/recuperar-senha.html` e `supabase/templates/convite.html`
     (links em português, que funcionam em qualquer aparelho).
   - Para enviar e-mails de verdade em produção, configure um SMTP próprio (*Emails → SMTP Settings*);
     o servidor de e-mail padrão do Supabase tem limite baixo de envios por hora.
4. **Primeiro usuário = administrador**: *Authentication → Users → Add user → Create new user*
   (marque *Auto Confirm User*). O primeiro usuário criado vira **Administrador** automaticamente;
   os seguintes entram como **Operacional** até o administrador mudar a função.
5. **Publicar na Vercel**: importe o repositório, defina **Root Directory = `sistema`** e cadastre as
   variáveis de `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `NEXT_PUBLIC_SITE_URL`).

Se o sistema for publicado sem as variáveis, ele mostra a tela "O banco de dados ainda não foi
conectado" em vez de quebrar.

### Mudar a função de um usuário (até a Fase 5)

No *SQL Editor* do Supabase:

```sql
update public.profiles set role = 'financeiro' where email = 'pessoa@exemplo.com';
-- funções: 'admin' | 'financeiro' | 'operacional'
```

## Desenvolvimento local

Requisitos: Node 20.9+, Docker (para o Supabase local).

```bash
cd sistema
npm install
npm run db:start            # sobe Supabase local (Postgres, Auth, Storage, Mailpit)
npm run db:reset            # aplica as migrações do zero
cp .env.example .env.local  # preencha com os valores de `npx supabase status`
npm run dev                 # http://localhost:3000
```

E-mails locais (recuperação de senha) aparecem no Mailpit: <http://127.0.0.1:54324>.

## Testes

| Comando | O que testa |
|---|---|
| `npm run check` | TypeScript + ESLint + testes unitários (dinheiro em centavos, validações, redirecionamento seguro) |
| `npm run test:db` | 29 testes de integração no Supabase **local**: RLS por função, saldos, transferências, fundos, orçamento→serviço, auditoria. Requer `.env.test` (veja `.env.test.example`) e banco recém-resetado |
| `node scripts/e2e-fase1.mjs [pasta]` | 23 verificações no navegador (Playwright): login, erros, menu, busca, perfil, senha, tema, recuperação por e-mail, celular, permissões. Requer app rodando, banco resetado e os usuários `admin@teste.local` e `op@teste.local` (senha `Teste1234`) criados nessa ordem |

## Documentação

- [ARCHITECTURE.md](ARCHITECTURE.md) — organização do código e decisões técnicas
- [DATABASE.md](DATABASE.md) — modelo de dados, regras financeiras e permissões
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — cores, tipografia e componentes
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — fases e status
