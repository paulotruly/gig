# 028: marca vetorial e botão do Google

**Situação:** `concluída`
**Depende de:** 020 (login com Google), 026 (PWA)
**Referências:** capturas da tela de login enviadas pela equipe em 22/11/2026

## Objetivo

Deixar a marca do GiG nítida em todos os lugares e alinhar o botão "Entrar com Google" ao visual da tela de acesso. Antes desta tarefa, o logo era um PNG pequeno, que ficava borrado no login, no cabeçalho e nos ícones do aplicativo, e o botão do Google era só um texto com borda.

## Requisitos

- R1: o símbolo e o nome "Greed is Great" são desenhados em vetor (SVG) no login e no cabeçalho do painel.
- R2: favicon, ícone da aba, ícone da Apple e ícones do PWA (192, 512 e maskable) são gerados a partir do mesmo vetor.
- R3: o ícone da aba continua legível em 16 px e em abas de tema escuro.
- R4: o botão do Google mostra o "G" oficial e segue o estilo dos campos e botões da tela de acesso; o texto muda para "Criar conta com Google" no cadastro.
- R5: quem já instalou o PWA recebe os ícones novos.

## Fora do escopo

- Mudança no fluxo de autenticação com o Google (continua o da 020).
- Cabeçalho móvel, que não mostra o logo.

## Critérios de aceite

- [x] C1: o login e o cadastro mostram o logo em SVG e o botão novo do Google.
- [x] C2: `/favicon.ico`, `/icon.png` e `/apple-icon.png` respondem 200 em desenvolvimento.
- [x] C3: depois da implantação, https://gigreat.online mostra o logo, o botão e o ícone da aba novos.

## Plano técnico

- `apps/web/src/components/ui/Logo.tsx`: `Logo` (símbolo + nome, com a fonte Plus Jakarta Sans) e `LogoMark` (só o símbolo).
- `apps/web/public/brand/gig-mark.svg`: símbolo em SVG, fonte dos ícones.
- `apps/web/scripts/gerar-icones.mjs`: gera os PNGs e o `favicon.ico` (16, 32 e 48 px) com o `sharp`. Uso: `node scripts/gerar-icones.mjs`, a partir de `apps/web`.
- `apps/web/public/sw.js`: versão do cache para `gig-v2`, para trocar os ícones guardados.
- `apps/web/src/components/auth/AuthScreen.tsx`: botão do Google com o "G" oficial e separador "ou com e-mail".

## Tarefas

- [x] T1: redesenhar o símbolo em SVG e criar o componente `Logo`.
- [x] T2: trocar os PNGs do login e do cabeçalho pelo componente.
- [x] T3: gerar de novo favicon, ícones da aba, da Apple e do PWA.
- [x] T4: refazer o botão do Google.
- [x] T5: implantar e conferir em produção (C3).

## Notas

- O ícone da aba é um quadrado branco de cantos arredondados, com traço mais grosso que o do logo, para ler em 16 px.
- Na máquina local havia cópias não versionadas de `favicon.ico`, `icon.png` e `apple-icon.png` em `apps/web/src/app/`. Elas conflitavam com as de `public/`, e o Next respondia 500. Os ícones ficam só em `public/`, referenciados pelo `layout.tsx`.
- `logo-transparent.png` e `logo-greed-is-great.png` ficaram sem uso, mas continuam em `public/`.
- Em 22/11/2026, https://gigreat.online passou a servir o `sw.js` com `gig-v2`, o `favicon.ico` novo e o login com o logo e o botão novos.
