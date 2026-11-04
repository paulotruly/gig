# 008: compromissos fixos e recebíveis

**Situação:** `a fazer`
**Depende de:** 004
**Referências:** `specs/motor-de-previsao.md`

## Objetivo

Registrar despesas fixas e recebíveis, necessários aos cenários e à retirada segura.

## Requisitos

- R1: O dono cria, lista e remove compromissos.
- R2: Cada compromisso tem tipo, valor positivo, vencimento e recorrência.
- R3: Mudanças marcam o negócio para recálculo.

## Critérios de aceite

- [ ] C1: Quando crio um compromisso com valor zero ou negativo, então recebo `400`.
- [ ] C2: Quando crio ou removo um compromisso, então a previsão é recalculada na próxima execução do worker.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
