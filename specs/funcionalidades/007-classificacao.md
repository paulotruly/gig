# 007: classificação PF-PJ e correção pelo usuário

**Situação:** `concluída`
**Depende de:** 006
**Referências:** `specs/motor-de-previsao.md`, regras 12 e 13

## Objetivo

Etiquetar cada transação e aprender com as correções do usuário.

## Requisitos

- R1: A classificação é uma função pura em `packages/shared`.
- R2: `GET /businesses/:id/transactions` lista com paginação e filtro por período.
- R3: `PATCH /transactions/:id` corrige a etiqueta e cria uma regra aprendida.
- R4: A regra aprendida vale para transações parecidas não corrigidas e futuras.

## Critérios de aceite

- [x] C1: Quando corrijo uma transação, então transações parecidas passam a usar a nova etiqueta.
- [x] C2: Uma transação corrigida à mão nunca é sobrescrita por regra.
- [x] C3: Quando tento corrigir a transação de outro negócio, então recebo `404`.

## Tarefas

- [x] T1: implementar os requisitos.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
