# 019: dados de demonstração

**Situação:** `concluída`
**Depende de:** 009, 011, 018
**Referências:** `specs/motor-de-previsao.md`, `specs/constituicao.md`

## Objetivo

Popular um banco local com um negócio fictício completo, para ver todas as telas do `apps/web` com dados sem precisar montar um extrato à mão. Dessa forma, quem desenvolve o front-end entra com um usuário pronto e já encontra previsão, alertas, transações e compromissos.

## Requisitos

- R1: `npm run seed` cria um usuário de demonstração, um MEI fictício, saldo atual, consentimento de entrada assistida, seis meses completos de transações, o mês corrente até hoje e compromissos futuros.
- R2: As transações são classificadas pelas mesmas regras da importação (`classifyTransaction`), e a previsão e os alertas são gerados pelo mesmo cálculo do worker (`recalculateBusiness`). A seed não grava nenhum valor calculado à mão.
- R3: Os dados são fictícios e determinísticos; nenhum dado real de cliente ou da equipe entra no repositório.
- R4: A seed se recusa a rodar com `NODE_ENV=production`.
- R5: Se o usuário de demonstração já existir, a seed não duplica nada e avisa. Como `consents` e `audit_log` são só de inserção, não há limpeza automática: para recomeçar, recrie o banco local.

## Fora do escopo

- Dados de parceiro e indicadores agregados.
- Seed para o banco de testes de integração, que tem os próprios dados.

## Critérios de aceite

- [x] C1: Dado um banco migrado e vazio, quando rodo `npm run seed`, então consigo entrar no app com o usuário de demonstração e ver os três cenários, a retirada segura e ao menos um alerta.
- [x] C2: Quando rodo `npm run seed` de novo, então nada é duplicado.
- [x] C3: Com `NODE_ENV=production`, a seed termina com erro sem gravar nada.

## Plano técnico

Script em `apps/worker/scripts/seed-demo.ts`, executado com `tsx` e lendo o `.env` da raiz, como o worker em desenvolvimento. O `argon2` entra como dependência de desenvolvimento do worker para gerar o hash da senha.

## Tarefas

- [x] T1: script da seed e comando `npm run seed`.
- [x] T2: conferir em um banco local.

## Notas

Usuário de demonstração: `demo@gig.local`, senha `demonstracao-gig`. Vale só para bancos locais.
