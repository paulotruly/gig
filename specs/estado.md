# Estado do projeto

Atualize este arquivo no mesmo commit de cada entrega. Mantenha-o curto: o histórico fica no git.

**Última atualização:** 04/11/2026

## Onde paramos

A fundação da API (001) está pronta em `apps/api`, com healthcheck, logs seguros, formato único de erro, testes e CI. Ainda não há banco nem regras de negócio.

## Funcionalidade em andamento

Nenhuma.

## Próximo passo

1. Resolver as pendências P-02, P-05, P-09 e P-11, que afetam o modelo de dados.
2. Especificar e implementar a funcionalidade 002 (modelo de dados e migrações).
3. Em paralelo, começar as funções puras da funcionalidade 009, que não dependem do banco.

## Bloqueios

Nenhum.

## Últimas decisões

- TypeScript, Express, Prisma e monorepo com todo o produto ([decisão 0002](decisoes/0002-stack-do-back-end.md)).
- Os PDFs ficam fora do git porque o repositório é público e eles trazem dados da equipe.
