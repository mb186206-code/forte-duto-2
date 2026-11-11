# Plano de implementação

Desenvolvimento por fases; cada fase só termina depois de testada.

## Fase 1 — Base do sistema ✅ concluída (11/11/2026)

- [x] Análise do repositório (site estático na raiz; sistema criado em `sistema/` sem tocar no site)
- [x] Arquitetura modular (ver ARCHITECTURE.md)
- [x] Next.js 16, React 19, TypeScript estrito, Tailwind 4, ESLint
- [x] Identidade visual e tema claro/escuro (ver DESIGN_SYSTEM.md)
- [x] Layout: menu lateral com 9 módulos, gaveta no celular, topo com busca global (Ctrl+K), ações rápidas, menu da conta
- [x] Supabase: clientes browser/servidor/proxy, tela de configuração pendente
- [x] Autenticação: login, sair, recuperação de senha por e-mail (modelos em português), redefinição, proteção de rotas, bloqueio de redirecionamento externo, usuário desativado
- [x] Perfil (nome, telefone), troca de senha, preferência de tema; admin vê a equipe
- [x] Banco completo: 20 tabelas, views de saldo, RLS por função, auditoria, Storage (ver DATABASE.md)
- [x] Testes: 43 unitários, 29 de banco/RLS, 24 de navegador (desktop + celular)
- [x] Ajuste pedido pelo Daniel: interface simples e pensada para o celular (barra inferior, botão "+", ações em linguagem do dia a dia)

## Fase 2 — Financeiro e fundos
- Dashboard com os 10 indicadores, filtro diário/semanal/mensal/personalizado, gráficos (entradas × saídas, faturamento mensal, despesas por categoria, evolução dos fundos), últimas movimentações, contas a vencer, alertas e estados vazios
- Contas financeiras (CRUD, saldo inicial, transferências)
- Entradas e despesas (formulários curtos, valor em reais, comprovante, confirmação antes de excluir)
- Histórico com busca, filtros, paginação, edição e detalhe
- Fundos: depósitos, retiradas, metas, gráfico de progresso, novos fundos
- Funções SQL de resumo por período; testes de todos os cálculos

## Fase 3 — Comercial
Clientes (cadastro rápido, aviso de duplicado, ficha completa), serviços (cartões, calendário,
fotos antes/depois, custos e margem), orçamentos (itens, validade, conversão em serviço com um
clique), histórico comercial, busca global em registros.

## Fase 4 — Marketing
Campanhas e anúncios, lançamento manual de métricas, gerador de links UTM, captura de UTM na
entrada de contatos, atribuição declarada/rastreada/desconhecida, indicadores (custo por contato,
custo por cliente, conversão, ROI). Integrações Meta/Google/WhatsApp ficam documentadas e só
serão ligadas com credenciais reais.

## Fase 5 — Relatórios e configurações
Relatórios (faturamento, despesas, resultado, fluxo de caixa, serviços, origens, campanhas,
pendências, fundos, evolução mensal), exportação PDF/Excel, impressão; convite e gestão de
usuários e funções (servidor com `SUPABASE_SECRET_KEY`), dados da empresa, categorias, formas de
pagamento, tipos de serviço, metas, backup (exportação) e tela do histórico de alterações.

## Fase 6 — Testes finais e publicação
Testes de todos os fluxos, cálculos, segurança (RLS e rotas) e responsividade; ajustes;
publicação na Vercel com o Supabase de produção.

## Dependências externas (precisam do Daniel)
- Projeto Supabase de produção (URL e chave publishable) — necessário para usar de verdade
- Endereço do sistema (ex.: subdomínio de forteduto.com.br) e projeto na Vercel
- SMTP para e-mails em volume (opcional no começo)
- Credenciais Meta Ads / Google Ads / WhatsApp Business (só na Fase 4, se quiser integração automática)
