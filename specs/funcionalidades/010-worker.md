# 010: worker e recálculo idempotente

**Situação:** `concluída`
**Depende de:** 009
**Referências:** regras 5, 18 e 19

## Objetivo

Recalcular previsões fora da API, com segurança para reexecutar.

## Requisitos

- R1: O worker processa negócios marcados para recálculo e recalcula diariamente, porque a data-base muda.
- R2: Reexecutar com a mesma entrada não cria outra previsão.
- R3: Duas execuções simultâneas não geram duplicatas.
- R4: O recálculo exige consentimento ativo.

## Critérios de aceite

- [x] C1: Quando rodo o recálculo duas vezes, então existe só uma previsão.
- [x] C2: Sem consentimento ativo, quando o worker roda, então nenhuma previsão é gerada.

## Tarefas

- [x] T1: implementar os requisitos.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.

A idempotência foi testada com quatro execuções simultâneas contra MySQL real.
