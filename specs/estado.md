# Estado do projeto

Atualize este arquivo no mesmo commit de cada entrega. Mantenha-o curto: o histórico fica no git.

**Última atualização:** 04/11/2026

## Onde paramos

O back-end do [09] está implementado em `apps/api`, `apps/worker`, `packages/shared` e `packages/db`, com testes contra MySQL real. O WhatsApp usa envio simulado, e o Open Finance só tem a interface. O front-end e os testes com Playwright são de outra frente.

## Funcionalidade em andamento

- [015: Open Finance](funcionalidades/015-open-finance.md): falta o provedor real, que depende da P-08.
- [017: provisionamento](funcionalidades/017-provisionamento.md): falta validar no CI e em um servidor.

## Próximo passo

1. Enviar a branch `tasks` e conferir o CI, inclusive o build das imagens.
2. Revisar as decisões decorrentes da [decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md).
3. Subir em um servidor Linux e conferir a 017.

## Bloqueios

- 015: definição de acesso ao Open Finance (P-08).
- WhatsApp real: conta WhatsApp Business.

## Últimas decisões

- Padrões para as lacunas do MVP ([decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md)).
- TypeScript, Express, Prisma e monorepo com todo o produto ([decisão 0002](decisoes/0002-stack-do-back-end.md)).
- Os PDFs ficam fora do git porque o repositório é público e eles trazem dados da equipe.
