# 018: integração do front-end com a API

**Situação:** `em andamento`
**Depende de:** 003, 004, 005, 006, 007, 008, 009, 011, 012
**Referências:** `specs/contrato-api.md`, `specs/arquitetura.md`, `specs/constituicao.md` (regra 11)

## Objetivo

As telas do `apps/web` deixam de usar dados fixos e passam a mostrar os dados do negócio de quem entrou, lidos da API. Dessa forma, o empreendedor usa o produto de ponta a ponta no navegador: cria conta, cadastra o negócio, envia o extrato e acompanha previsão, transações, compromissos, alertas e trilhas.

## Requisitos

- R1: O front acessa a API na mesma origem, pelo caminho `/api`. Em produção, o Nginx encaminha; em desenvolvimento, o próprio Next encaminha para `API_INTERNAL_URL`, que não usa o prefixo `NEXT_PUBLIC_`.
- R2: A sessão continua no cookie `gig_session` `httpOnly`. O JavaScript do front nunca lê nem guarda token; toda chamada usa `credentials: 'include'`. O `localStorage` guarda só preferências visuais.
- R3: Em `401`, o front tenta `POST /auth/refresh` uma vez; se falhar, volta para a tela de entrada.
- R4: O front não calcula valor oficial (regra 11): saldo, cenários, runway, retirada segura e classificação vêm da API. O front só formata.
- R5: Entradas são validadas com os esquemas de `@gig/shared/contracts` antes do envio, e a API continua validando.
- R6: O upload de extrato aceita `.csv` e `.ofx` de até 5 MB, mesmo limite da API. Sem consentimento de entrada assistida, o front oferece concedê-lo e reenviar.
- R7: Texto vindo de extrato é sempre exibido como texto, nunca como HTML.
- R8: O Next responde com `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` sem câmera, microfone e localização.
- R9: A API oferece `GET /auth/me` para o front saber quem está na sessão após recarregar a página.
- R10: `GET /businesses` passa a informar `cashBalance` e `cashBalanceDate`, para o painel mostrar o saldo informado.
- R11: O que a tela mostrava e a API não fornece fica oculto ou com aviso, e vai para `specs/pendencias.md`.

## Fora do escopo

- Canal real do WhatsApp: a tela continua simuladora.
- Totais de receitas e despesas do mês, metas e progresso salvo das trilhas por negócio: a API ainda não fornece (P-17).
- Tela do parceiro e gestão de contadores.
- Testes de ponta a ponta com Playwright (outra frente).

## Critérios de aceite

- [ ] C1: Dado que não há sessão, quando abro o app, então vejo a tela de entrada e posso criar conta.
- [ ] C2: Dado que entrei e não tenho negócio, quando concluo o cadastro do negócio e do saldo, então vejo o painel.
- [ ] C3: Quando recarrego a página, então continuo na sessão sem token no `localStorage`.
- [ ] C4: Quando envio um CSV válido, então vejo quantas linhas foram importadas e as transações aparecem classificadas.
- [ ] C5: Quando corrijo o rótulo de uma transação, então a lista reflete a resposta da API.
- [ ] C6: Quando crio ou excluo um compromisso, então a lista é atualizada.
- [ ] C7: Sem previsão gerada, o painel e a tela de cenários explicam que falta histórico; com previsão, mostram os três cenários, o runway e a explicação.
- [ ] C8: `GET /auth/me` responde o usuário da sessão e `401` sem sessão.

## Plano técnico

- API: `GET /auth/me` em `apps/api/src/modules/auth.ts`; saldo na listagem de `modules/businesses.ts`.
- Contratos: esquemas de resposta em `packages/shared/src/contracts/index.ts`, com testes.
- Web: `apps/web` vira workspace; `next.config.js` com `rewrites` e `headers`; `src/lib/api.ts` (cliente), `src/lib/session.tsx` (sessão e negócio), `src/lib/useResource.ts`, `src/lib/format.ts`; telas novas em `components/auth` e `components/onboarding`; telas existentes passam a receber dados da API.
- Infra: alvo `web` no `Dockerfile` e serviço `web` no `docker-compose.yml`.

## Tarefas

- [x] T1: `GET /auth/me` e saldo em `GET /businesses`, com testes de integração.
- [x] T2: esquemas de resposta em `@gig/shared/contracts`, com testes.
- [ ] T3: `apps/web` como workspace, `rewrites`, cabeçalhos de segurança e `.env.example`.
- [ ] T4: cliente da API, sessão e negócio atual.
- [ ] T5: telas de entrada, cadastro e configuração do negócio.
- [ ] T6: painel, cenários, transações, compromissos, trilhas, alertas e importação ligados à API.
- [ ] T7: serviço `web` no Docker.
- [ ] T8: conferir ponta a ponta localmente.

## Notas

O `apps/web` chegou pela branch `feat/task-01`, com telas sobre dados fixos; os artefatos de build que vieram nela saíram do versionamento.
