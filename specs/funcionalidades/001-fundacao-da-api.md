# 001: fundação da API

**Situação:** `em andamento`
**Depende de:** nenhuma
**Referências:** `specs/arquitetura.md`, `specs/constituicao.md` (regras 7, 8, 17 e 19), `specs/decisoes/0002-stack-do-back-end.md`, [09] §03, §10 e §11

## Objetivo

Criar a base do back-end para que as próximas funcionalidades já nasçam com lint, testes, CI, logs seguros e um formato único de erro. Ainda não há funcionalidade para o empreendedor.

## Requisitos

- R1: o repositório é um monorepo com npm workspaces, e a API fica em `apps/api`.
- R2: `GET /health` responde `200` com `{ "status": "ok" }`, sem consultar o banco.
- R3: variáveis de ambiente são validadas na inicialização, e um valor inválido impede a API de subir.
- R4: os logs são estruturados e registram só método, rota, status, duração e identificador da requisição. Corpo, cookies, cabeçalho de autorização e query string nunca são registrados (regra 7).
- R5: todo erro responde no formato `{ "error": { "code": "...", "message": "..." } }`, sem expor detalhes internos.
- R6: a API aplica cabeçalhos de segurança com helmet.
- R7: a API encerra de forma graciosa ao receber `SIGTERM` ou `SIGINT`.
- R8: o CI roda instalação, lint, formato, tipos, testes, build e auditoria de dependências.

## Fora do escopo

- Prisma, esquema e migrações: 002.
- Checagem do banco no healthcheck: 002.
- CORS e limite de requisições: 003.
- `apps/worker`: 010.
- `packages/shared`: criado com o primeiro contrato compartilhado.
- `apps/web`: outra frente de trabalho.
- Dockerfiles, Compose e Nginx: P-13.

## Critérios de aceite

- [ ] C1: dado que a API está no ar, quando chamo `GET /health`, então recebo `200` e `{ "status": "ok" }`.
- [ ] C2: quando chamo uma rota inexistente, então recebo `404` com o código `not_found`.
- [ ] C3: quando um handler falha, então recebo `500` com o código `internal_error`, sem a mensagem original do erro.
- [ ] C4: quando envio um JSON malformado, então recebo `400` com o código `invalid_json`.
- [ ] C5: quando uma variável de ambiente é inválida, então a API não sobe e informa qual variável falhou, sem mostrar o valor.
- [ ] C6: quando uma requisição traz corpo, cookies, autorização e query string, então nenhum desses dados aparece no log.
- [ ] C7: quando lint, formato, tipos, testes e build rodam em uma instalação limpa, então todos passam.
- [ ] C8: quando a API recebe um sinal de encerramento, então ela fecha o servidor e termina com código 0.

## Plano técnico

- **Node 22** e **TypeScript 6** em modo estrito. A versão 7 ainda não é aceita por `typescript-eslint` e `ts-jest`.
- **Express 5**, que encaminha ao middleware de erro as falhas de handlers assíncronos.
- **zod** para o ambiente e, nas próximas funcionalidades, para as requisições.
- **pino e pino-http**, com serializadores que listam os campos permitidos.
- **Jest, ts-jest e Supertest** para os testes.
- `src/app.ts` monta a aplicação sem abrir porta, para os testes. `src/server.ts` abre a porta e cuida do encerramento.

## Tarefas

- [ ] T1: criar a raiz do monorepo, com workspaces, TypeScript, ESLint e Prettier.
- [ ] T2: criar `apps/api` com configuração, logger, aplicação e servidor.
- [ ] T3: implementar `GET /health` e os middlewares de erro e de rota não encontrada.
- [ ] T4: escrever os testes dos critérios C1 a C6.
- [ ] T5: criar o workflow de CI.
- [ ] T6: verificar em instalação limpa e executar o build de verdade.

## Notas

O formato de erro foi definido aqui porque o contrato não o previa, e passa a constar em `specs/contrato-api.md`.
