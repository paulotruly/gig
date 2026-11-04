# 0002: stack do back-end e estrutura do repositório

**Data:** 04/11/2026
**Situação:** aceita

## Contexto

O [09] definiu Node.js e MySQL, mas deixou em aberto a linguagem, o framework da API, a ferramenta de acesso a dados e a organização do repositório. A funcionalidade 001 estava bloqueada à espera de uma documentação da stack, que não é necessária: essas escolhas cabem à equipe.

## Decisão

- **Linguagem:** TypeScript, em modo estrito.
- **Framework da API:** Express.
- **Acesso a dados e migrações:** Prisma.
- **Repositório:** monorepo único com todo o produto, usando npm workspaces, com `apps/web`, `apps/api`, `apps/worker` e `packages/shared`. O front-end fica neste repositório, sob responsabilidade de outra frente de trabalho.

## Consequências

- O contrato da previsão pode ser compartilhado entre front-end e back-end por `packages/shared`.
- A API e o worker passam a ter uma etapa de build.
- Com Express, validação, logs e tratamento de erros dependem de bibliotecas e middlewares próprios, definidos na funcionalidade 001.
- Com Prisma, os agregados do parceiro podem exigir consultas SQL parametrizadas, sem concatenação (regra 17).
- O isolamento por `business_id` (regra 3) continua sendo responsabilidade do código, porque o Prisma não o impõe sozinho.
- Servidor local só no piloto ou também na operação e canal inicial continuam em aberto na P-12.
