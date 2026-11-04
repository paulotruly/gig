# 016: eventos de uso, backup e restauração

**Situação:** `a fazer`
**Depende de:** 002
**Referências:** [09] §10.3, `specs/arquitetura.md`, P-15

## Objetivo

Medir o uso sem dados financeiros e garantir que os dados podem ser recuperados.

## Requisitos

- R1: A API registra `consent_granted`, `first_forecast_viewed`, `weekly_open` e `track_completed`.
- R2: Eventos únicos não se repetem.
- R3: O backup gera um dump cifrado, e o script de restauração o recupera.

## Critérios de aceite

- [ ] C1: Quando vejo a primeira previsão duas vezes, então só há um evento.
- [ ] C2: Quando restauro um backup em um banco vazio, então os dados voltam.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
