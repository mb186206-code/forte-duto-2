# Plano de implementação

Desenvolvimento por fases; cada fase só termina depois de testada.

## Fase 1 — Base do sistema ✅ concluída (11/11/2026)

- [x] Análise do repositório (site estático na raiz; sistema criado em `sistema/` sem tocar no site)
- [x] Arquitetura modular (ver ARCHITECTURE.md)
- [x] Next.js 16, React 19, TypeScript estrito, Tailwind 4, ESLint
- [x] Identidade visual e tema claro/escuro (ver DESIGN_SYSTEM.md)
- [x] Layout: menu lateral com 9 módulos, gaveta no celular, topo com busca global (Ctrl+K), ações rápidas, menu da conta
- [x] Supabase: acesso só pelo servidor, tela de configuração pendente
- [x] Entrada simples (pedido do Daniel): nome + senha uma vez por celular, passe assinado de 400 dias, "sair deste celular"
- [x] Configurações: trocar nome, tema claro/escuro
- [x] Banco completo: tabelas, views de saldo, acesso só pelo servidor, histórico com o nome de quem fez, Storage (ver DATABASE.md)
- [x] Testes: 36 unitários, 22 de banco, 14 de navegador (celular + computador)
- [x] Ajuste pedido pelo Daniel: interface simples e pensada para o celular (barra inferior, botão "+", ações em linguagem do dia a dia)

## Fase 2 — Financeiro e fundos ✅ concluída (11/11/2026)
- Dashboard com os 10 indicadores, filtro diário/semanal/mensal/personalizado, gráficos (entradas × saídas, faturamento mensal, despesas por categoria, evolução dos fundos), últimas movimentações, contas a vencer, alertas e estados vazios
- Contas financeiras (CRUD, saldo inicial, transferências)
- Entradas e despesas (formulários curtos, valor em reais, comprovante, confirmação antes de excluir)
- Histórico com busca, filtros, paginação, edição e detalhe
- Fundos: depósitos, retiradas, metas, gráfico de progresso, novos fundos
- Funções SQL de resumo por período; testes de todos os cálculos

## Fase 3 — Comercial ✅ concluída (11/11/2026)
Clientes (cadastro rápido, aviso de duplicado, ficha completa), serviços (cartões, calendário,
fotos antes/depois, custos e margem), orçamentos (itens, validade, conversão em serviço com um
clique), histórico comercial, busca global em registros.

## Fase 4 — Marketing ✅ concluída (11/11/2026)
Campanhas e anúncios, lançamento manual de métricas, gerador de links UTM, captura de UTM na
entrada de contatos, atribuição declarada/rastreada/desconhecida, indicadores (custo por contato,
custo por cliente, conversão, ROI). Integrações Meta/Google/WhatsApp ficam documentadas e só
serão ligadas com credenciais reais.

## Fase 5 — Relatórios e configurações ✅ concluída (11/11/2026)
Relatórios (faturamento, despesas, resultado, fluxo de caixa, serviços, origens, campanhas,
pendências, fundos, evolução mensal), exportação PDF/Excel, impressão; convite e gestão de
dados da empresa, categorias, formas de
pagamento, tipos de serviço, metas, backup (exportação) e tela do histórico de alterações.

## Fase 6 — Testes finais e publicação ✅ concluída (11/11/2026)
Testes de todos os fluxos, cálculos, segurança (acesso e rotas) e responsividade; ajustes;
publicação na Vercel com o Supabase de produção.

## Dependências externas (precisam do Daniel)
- Projeto Supabase de produção (Project URL e chave secreta) — necessário para salvar dados de verdade
- Endereço próprio do sistema (opcional, ex.: subdomínio de forteduto.com.br)
- Credenciais Meta Ads / Google Ads / WhatsApp Business (só na Fase 4, se quiser integração automática)

## Observações da entrega
- Nenhuma fase exigiu mudança no banco além das 4 migrações iniciais.
- Integrações Meta/Google/WhatsApp continuam fora: os números dos anúncios são lançados à mão.
- Planilhas são CSV (o Excel abre direto); PDF pelo botão de imprimir.
