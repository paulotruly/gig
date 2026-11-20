# Estado do projeto

Atualize este arquivo no mesmo commit de cada entrega. Mantenha-o curto: o histórico fica no git.

**Última atualização:** 20/11/2026

## Onde paramos

O back-end do [09] está implementado em `apps/api`, `apps/worker`, `packages/shared` e `packages/db`, com testes contra MySQL real. O WhatsApp usa envio simulado, e o Open Finance só tem a interface. O `apps/web` (vindo da `feat/task-01`) consome a API em todas as telas que ela cobre, e `npm run seed` cria um negócio de demonstração; os testes com Playwright são de outra frente.

A [020](funcionalidades/020-login-com-google.md) permite entrar e criar a conta com o Google, já em produção. A [021](funcionalidades/021-ajustes-do-teste-das-telas.md) corrigiu o que o teste das telas encontrou: endereço por tela, busca de transações, modais pelo teclado e progresso das trilhas.

## Funcionalidade em andamento


- [015: Open Finance](funcionalidades/015-open-finance.md): falta o provedor real, que depende da P-08.
- [017: provisionamento](funcionalidades/017-provisionamento.md): a `main` se implanta sozinha no servidor `ignam` e está em `https://gigreat.online`, pelo Cloudflare Tunnel; falta a conferência de `SIGTERM`.
- [018: integração do front-end](funcionalidades/018-integracao-do-front-end.md): as telas foram conferidas no navegador em 20/11/2026; os problemas encontrados foram corrigidos na 021; faltam os critérios C1, C2, C6 e C7.

## Próximo passo

1. Decidir a reserva da retirada segura (P-18).
2. Revisar as decisões decorrentes da [decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md).
3. Conferir na Cloudflare, depois de alguns dias, que o bucket `gig-backups` recebe um backup por dia.

## Bloqueios

- 015: definição de acesso ao Open Finance (P-08).
- WhatsApp real: conta WhatsApp Business.

## Últimas decisões

- Implantação puxada pelo servidor e domínio pelo Cloudflare Tunnel ([decisão 0004](decisoes/0004-implantacao-puxada-pelo-servidor.md)).
- Padrões para as lacunas do MVP ([decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md)).
- TypeScript, Express, Prisma e monorepo com todo o produto ([decisão 0002](decisoes/0002-stack-do-back-end.md)).
- Os PDFs ficam fora do git porque o repositório é público e eles trazem dados da equipe.
