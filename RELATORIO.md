# Relatório de entrega: site Forte Duto

Data: 13/10/2026 · Pré-visualização: https://claude.ai/artifact/9Km2QqDVBz2bDRknE3qH23

## Como publicar

1. Defina o domínio em `site.config.json` (`"site_url": "https://seudominio.com.br"`).
2. Rode `python3 build.py`. A pasta `dist/` é o site pronto.
3. Suba o conteúdo de `dist/` em qualquer hospedagem estática com HTTPS (Netlify, Vercel, Cloudflare Pages, Hostinger etc.).

Sem domínio definido, o build omite de propósito canonical, `og:url`, `og:image`, `twitter:image` e `sitemap.xml` para não publicar URL errada.

## A. Resumo

**Auditoria:** não havia projeto anterior (pasta vazia, só a logo). Stack escolhida: HTML + CSS + JS puros, sem framework e sem dependências em produção, com um build em Python que minifica e embute o CSS/JS. Motivo: site de uma página com formulário, onde isso dá a melhor performance e a manutenção mais simples.

**Páginas:** `index.html` (página inicial) e `privacidade.html` (Política de privacidade, LGPD).

**Seções da página inicial, nesta ordem:**
1. Cabeçalho (estrutura básica, conforme pedido): logo, links, botão WhatsApp. Menu móvel, estados ativos e animações ficam para a próxima etapa; o botão do menu móvel está reservado no código.
2. Hero: título, descrição, botão amarelo de orçamento no WhatsApp, botão de ligação, logo oficial.
3. "O que você está vendo aí?": tabela de sintomas (o que você percebe / onde acontece / o que pode ser). No celular vira fichas. É o conteúdo próprio do setor e ajuda o cliente a descrever o problema.
4. Serviços: 8 serviços, cada um com descrição própria e link de WhatsApp com mensagem específica.
5. Como funciona: 5 etapas numeradas (a numeração tem sentido, é uma sequência).
6. Sobre + motivos para falar direto com a empresa (só fatos que se sustentam: número oficial, desentupimento e encanamento juntos, avaliação por foto/vídeo).
7. Regiões atendidas: faixa amarela com botão "Consultar meu bairro". A lista de bairros está pronta no código, oculta até ser confirmada.
8. Perguntas frequentes: 7 perguntas, sem inventar dados (respostas encaminham para confirmação quando a informação não existe).
9. Orçamento: formulário + WhatsApp + telefone.
10. Rodapé: marca, navegação, contatos, Política de privacidade.

**Avaliações:** a seção existe como `<template>` no código, mas não é exibida, porque não há depoimentos reais.

**O que funciona de verdade:**
- Botão flutuante de WhatsApp (círculo amarelo no celular, "WhatsApp" escrito no computador). Pulsa 3 vezes ao carregar e para; sem animação para quem pede movimento reduzido. Fica escondido no hero (que já tem o botão principal), no formulário e no rodapé, para não cobrir botões, campos nem links.
- 15 links de WhatsApp, todos para `https://wa.me/5521987114521`, com mensagens pré-preenchidas codificadas por origem.
- 3 links `tel:+5521987114521`.
- Formulário: valida no navegador, mostra erros por campo, foca o primeiro erro e monta a mensagem com nome, telefone, bairro, problema e detalhes, abrindo o WhatsApp. O site não diz que o pedido foi enviado: avisa que ele só chega quando o cliente envia pelo WhatsApp. Tem honeypot antispam.
- Se no futuro houver backend, basta preencher `form_endpoint` no config: o formulário faz POST JSON e só confirma com resposta 2xx.

**Integrações que dependem de terceiros:** Google Search Console, Analytics, Perfil da Empresa no Google e backend de formulário. Nenhuma foi ativada.

## B. Arquivos

Todos novos, em `/mnt/project-files/forte-duto/`:
- `src/index.html`, `src/privacidade.html`, `src/css/site.css`, `src/js/site.js`
- `src/img/` (WebP), `src/fonts/barlow-condensed-latin-700-normal.woff2`
- `src/favicon.ico` (16/32/48), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180), `icon-512.png`, `og-image.webp` (1200×630), `site.webmanifest`
- `site.config.json`, `build.py`
- `dist/` (gerado pelo build), `preview/` (versão para o Artifact)

Nenhum arquivo removido. A logo original foi mantida intacta em `src/img/logo-original.jpg`.

## C. Imagens

Original: `logo-original.jpg`, JPG 640×640, 100,4 KB. É um recorte de panfleto, com pedaços de texto de outras peças nas bordas. Para o site, recortei a área do selo (560×560, sem os textos do panfleto), sem redesenhar nada.

| Arquivo | Formato | Uso | Tamanho | vs. original |
|---|---|---|---|---|
| forte-duto-logo-280.webp | WebP q80 | hero, celular | 32,0 KB | −68% (−68,4 KB) |
| forte-duto-logo-400.webp | WebP q80 | hero, padrão | 49,9 KB | −50% (−50,4 KB) |
| forte-duto-logo-560.webp | WebP q80 | hero, telas densas | 72,1 KB | −28% (−28,3 KB) |
| forte-duto-mark-96.webp | WebP q80 | cabeçalho 1x | 5,6 KB | −94% |
| forte-duto-mark-192.webp | WebP q80 | cabeçalho 2x | 15,5 KB | −85% |
| og-image.webp | WebP q85 | compartilhamento | 90,8 KB | novo |

O navegador baixa só uma versão do hero (via `srcset`/`sizes`). A imagem do hero tem `fetchpriority="high"`, preload e não usa lazy loading. Todas as imagens têm `width`/`height`.

**Não há fotos reais** da equipe ou de serviços. Não usei banco de imagens para não sugerir que são da empresa. Fotos reais de serviços seriam o maior ganho visual do site.

## D. SEO

- Implementado: `title` (40 caracteres), `description` (143), `robots index,follow`, `author`, `lang="pt-BR"`, `theme-color`, favicons, manifest, Open Graph (type, site_name, locale, title, description), Twitter Card `summary_large_image`, um H1 e hierarquia H2/H3.
- JSON-LD `Plumber` com nome, descrição, telefone e serviços. Url, logo e imagem entram automaticamente quando houver domínio. Endereço, área atendida, horário e redes sociais ficam vazios no config até serem confirmados.
- `robots.txt`: libera tudo. A linha do `Sitemap` entra com o domínio.
- **Pendente (domínio):** canonical, `og:url`, `og:image`, `twitter:image`, `sitemap.xml`. Tudo é gerado sozinho ao preencher `site_url`.
- Não criei páginas individuais de serviço nem de bairro. Sem conteúdo real (fotos, bairros, casos), elas sairiam quase idênticas, o que o próprio prompt proíbe.

## E. Acessibilidade

- Lighthouse Accessibility: 100 (mobile e desktop).
- Verificado: link "Pular para o conteúdo" é o primeiro Tab; foco visível em todos os controles (amarelo nas áreas azuis, azul nas claras); labels em todos os campos; erros ligados por `aria-describedby` + `aria-invalid`; status do formulário em `role="status"`; `prefers-reduced-motion` respeitado; compensação do cabeçalho fixo nas âncoras (`scroll-margin-top`).
- Contraste: amarelo #FFD32A com texto #071A3D ≈ 12:1; branco sobre #0B2F6B ≈ 12:1.
- Pendente: teste com leitor de tela real (NVDA/VoiceOver).

## F. Testes

- Build de produção: ok, sem erros.
- Larguras 320, 375, 390, 768, 1024 e 1440 px: sem rolagem horizontal e sem elementos fora da tela (checado por script no Chromium), sem erros de console nem requisições quebradas.
- Links: 35 links; 15 de WhatsApp todos para o número certo; 3 `tel:`; todas as âncoras internas existem.
- Formulário: envio vazio mostra 4 erros e foca "Nome"; envio válido gera a mensagem correta no WhatsApp.
- Limitação: este ambiente bloqueia o acesso ao wa.me, então testei a URL gerada, mas não a abertura do app. Vale um clique no celular.

## G. Performance (Lighthouse 13, laboratório)

Ambiente: Chromium headless local, servidor estático, throttling padrão do Lighthouse.

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile | 99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Mobile: FCP 1,1 s · LCP 2,0 s · TBT 10 ms · CLS 0 · Speed Index 2,3 s. Desktop: FCP 0,3 s · LCP 0,5 s · TBT 0 ms · CLS 0.

São dados de laboratório, não de usuários reais. O PageSpeed Insights só pode rodar depois que o site estiver no ar (pagespeed.web.dev). Não havia medição anterior para comparar.

Página inicial: 1 HTML (40 KB, com CSS e JS embutidos) + 1 fonte (22 KB) + 2 imagens. Nenhum script de terceiros.

## H. Checklist

**Concluído e verificado**
- Estrutura completa e seções
- Paleta azul/branco/amarelo
- Revisão anti-AI-slop: sem estatísticas, depoimentos ou selos inventados; números só nas etapas
- Links de WhatsApp e telefone
- Validação do formulário
- Responsividade nas 6 larguras
- Favicons e imagem OG 1200×630
- Lighthouse acima das metas

**Implementado, mas não verificado**
- Abertura real do WhatsApp no celular
- Comportamento em Safari/iOS
- Leitor de tela

**Pendente por falta de informação**
- Domínio (canonical, OG absoluto, sitemap)
- Lista de bairros
- Horário de funcionamento
- Confirmação do atendimento 24h: a logo mostra "24H", mas o texto do site não promete isso até a empresa confirmar
- Lista final de serviços: os 8 serviços são candidatos do prompt
- Atendimento comercial
- História da empresa
- E-mail
- Endereço
- Depoimentos
- Fotos reais
- Logo em alta resolução/vetor: a atual tem 640 px e fica pouco legível como favicon de 16 px

**Pendente por integração**
- Search Console
- Analytics
- Perfil da Empresa no Google
- Backend do formulário (opcional)

**Fora do escopo desta etapa**
- Acabamento do menu e menu móvel

## Atualização: botão flutuante e skiper76

- Adicionei o botão flutuante de WhatsApp (ver A). Ele foi testado em 390 e 1440 px: aparece nos Serviços e some no formulário e no rodapé.
- Removi a barra amarela lateral da lista "Por que falar direto com a gente", pela diretriz anti-slop (barra lateral sem ser citação).
- **skiper76 não foi instalado.** É o "Apple Feature Block", uma vitrine de recursos do iPhone em React + framer-motion. Ele exige licença Pro do Skiper UI e o domínio está bloqueado neste ambiente. Também não encaixa no site atual: o site é HTML puro, e trazer React + framer-motion só para isso acrescentaria mais de 100 KB de JavaScript. Além disso, o componente depende de fotos de produto, que a Forte Duto ainda não tem.

## Conferência do checklist "PageSpeed 95+ e SEO 100"

Conferido no `dist/` em 13/10/2026.

**Imagens**
- [x] Imagens raster do site em WebP. A pasta publicada não tem nenhum JPG.
- [x] Originais fora do site publicado. `logo-original.jpg` fica só em `src/` como backup, conforme o prompt mestre.
- [x] Referências apontam para .webp.
- [x] Hero sem lazy e com `fetchpriority="high"`.
- [x] Lazy abaixo da dobra: não se aplica, porque não há imagens abaixo da dobra.
- [x] OG image de 1200×630.

**Fontes**
- [x] `font-display: swap`.
- [x] 1 família (Barlow Condensed) mais a fonte do sistema.
- [x] Fonte em woff2.

**Scripts e animações**
- [x] Pulso do botão flutuante em CSS @keyframes, com 3 repetições.
- [x] Nenhuma biblioteca.
- [x] Nenhum script de terceiros.
- [x] Nenhum script bloqueando a renderização (JS embutido no fim do body).

**HTML e acessibilidade**
- [x] `lang="pt-BR"`.
- [x] Logo do cabeçalho com `alt=""` e `aria-hidden="true"`.
- [x] Logo do hero com alt descritivo.
- [x] Contraste AA (Lighthouse Acessibilidade 100).
- [x] Links e botões com nome acessível.
- [x] Títulos em ordem: H1 → H2 → H3, sem pular níveis.

**Meta tags**
- [x] Title com 40 caracteres.
- [x] Description com 143 caracteres.
- [x] robots `index, follow`.
- [x] author.
- [ ] Canonical absoluto: **pendente do domínio**.

**Open Graph e Twitter**
- [x] og:type, og:title, og:description, og:site_name, og:locale.
- [x] twitter:card, twitter:title, twitter:description.
- [ ] og:url, og:image absoluto + og:image:alt, twitter:image: **pendentes do domínio**.

Testei o build com um domínio de teste: com `site_url` preenchido, canonical, og:url, og:image, twitter:image e sitemap saem corretos.

**Dados estruturados e ícones**
- [x] JSON-LD Plumber.
- [x] favicon.ico (16/32/48), favicon-32x32, favicon-16x16.
- [x] apple-touch-icon 180×180.
- [x] theme-color #0B2F6B.

**Segurança**
- [x] 17 links com `target="_blank"`, todos com `rel="noopener noreferrer"`.
- [x] Nenhum erro no console.
- [x] Nenhuma dependência em produção, portanto nenhuma vulnerabilidade de biblioteca.
- [ ] HTTPS: **depende da hospedagem**. As hospedagens estáticas sugeridas já oferecem HTTPS.

## Atualização: refinamento visual no estilo Apple

O layout não mudou; mudou só o acabamento.

**Cores**
- Um único azul de ação, `#0066CC`, em todos os CTAs e links: botões de WhatsApp, "Pedir orçamento" dos serviços, "Consultar meu bairro", envio do formulário e botão flutuante.
- O amarelo da marca deixou os botões. Ele continua na faixa de Regiões, nos números das etapas, no subtítulo do hero e nos títulos do rodapé.

**Formas e separadores**
- Botões em formato pill (raio 980px).
- Sem sombras. O botão flutuante agora se separa do fundo com borda branca.
- Hairlines de 1px nos separadores: tabela, serviços, lista de motivos, FAQ, campos do formulário, rodapé e trilho das etapas.
- Removi a borda amarela de 6px do formulário, a borda de 3px do card de emergência e as bordas de 2px dos campos e botões.

**Tipografia e espaço**
- Escala de pesos 400 / 600 / 700, sem 500.
- Mais respiro entre e dentro das seções: o espaçamento vertical subiu de até 6rem para até 8rem.

**Lighthouse após a mudança:** mobile 99/100/100/100, desktop 100/100/100/100. Nenhuma rolagem horizontal nas 6 larguras testadas.
