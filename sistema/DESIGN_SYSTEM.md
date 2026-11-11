# Design system — Forte Duto Gestão

Identidade própria (não copia o site de referência), sóbria, de SaaS profissional.
Tokens em `src/app/globals.css`; tudo usa variáveis, então o tema escuro é automático.

## Cores

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `brand-navy` | `#172C4A` | — | Marca, menu lateral, botão principal (claro) |
| `brand-blue` | `#245B91` | — | Informação, links, gráficos |
| `brand-yellow` / `highlight` | `#F2C230` | `#F2C230` | Ação rápida "Novo", indicador do menu, avatar. **Usar pouco.** |
| `background` | `#F5F7FA` | `#0B1421` | Fundo da página |
| `card` | `#FFFFFF` | `#111D2E` | Cartões, formulários |
| `primary` | `#172C4A` | `#4F8FD1` | Botão principal |
| `success` / `warning` / `destructive` | verde / âmbar / vermelho | versões claras | Recebido/pago, vencendo, atrasado/erro |
| `chart-1..5` | azul, amarelo, verde, vermelho, cinza | idem claros | Gráficos (Recharts) |

Cada cor de status tem uma versão `-soft` para fundos de badges e alertas. Texto sobre amarelo é
sempre azul-marinho (contraste AA).

## Tipografia

- **Inter** — textos, números, formulários. Valores monetários usam `.tabular` (algarismos alinhados).
- **Barlow Condensed** (600/700) — só na marca e em títulos de destaque, a mesma do site.
- Tamanhos: título de página 24–27 px, título de cartão 16 px, texto 14–16 px. Em celular os
  campos têm 16 px para o iPhone não dar zoom.

## Forma e espaço

- Raio: cartões 12 px (`rounded-xl`), botões/campos 8 px (`rounded-lg`), modais 16 px.
- Sombras discretas; bordas de 1 px fazem a separação.
- Alvos de toque ≥ 40 px (botões 40 px, campos 44 px no celular).

## Componentes (`src/components/ui`)

Button (default, highlight, secondary, outline, ghost, destructive, link; com `loading`), Input,
Label, Field (rótulo + ajuda + erro), Card, Badge, Alert, Avatar, Separator, Skeleton,
DropdownMenu, Dialog, Sheet (gaveta do celular), Tooltip, Command (busca global).

Padrões compartilhados: `PageHeader`, `EmptyState` (estado vazio com orientação),
`ModuleComingSoon`, `FormMessage`, `PasswordInput` (mostrar/esconder).

## Regras de uso

1. Uma ação principal por tela (`primary`); amarelo só para "Novo" e destaques.
2. Valores sempre em reais com `formatBRL()`.
3. Todo formulário: rótulo visível, campos opcionais marcados "(opcional)", erro em português embaixo do campo, botão com estado de carregamento.
4. Exclusão sempre com confirmação (Dialog).
5. Lista vazia sempre com `EmptyState` explicando o próximo passo.
6. Animações curtas (150–300 ms) e desligadas com `prefers-reduced-motion`.
7. Ícones Lucide, 16–20 px, nunca sozinhos sem `aria-label`.

## Celular em primeiro lugar (pedido do Daniel, 11/11/2026)

O sistema vai ser usado principalmente no celular, por quem não tem familiaridade com informática.

- **Barra de baixo** (`BottomNav`): mostra 3 abas com nomes simples (Início, Dinheiro, Serviços ou Clientes, conforme a função), um botão **"+" amarelo** grande no meio e o **Menu** com todas as áreas.
- **"+" e Início** usam os mesmos botões grandes (`QuickActionList`), escritos em linguagem do dia a dia: "Recebi dinheiro", "Paguei uma conta", "Novo cliente", "Novo serviço" e "Novo orçamento".
- **Topo do celular**: só a marca, a lupa de busca e a conta. O tema fica nas Configurações.
- **Nada técnico para o usuário**: fases e status do banco ficam na documentação. O que ainda não foi liberado aparece como "Em breve".
- Formulários com o mínimo de campos e botões grandes.
