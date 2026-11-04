# 004: negócios e isolamento por business_id

**Situação:** `concluída`
**Depende de:** 003
**Referências:** regra 3, `specs/contrato-api.md`

## Objetivo

Permitir criar negócios e garantir que cada pessoa só veja os seus.

## Requisitos

- R1: Quem cria o negócio vira dono.
- R2: O dono autoriza e remove contadores.
- R3: Quem não pertence ao negócio recebe `404`.
- R4: O contador só acessa o envio de extrato.
- R5: O dono informa o saldo atual.

## Critérios de aceite

- [x] C1: Quando outra pessoa acessa meu negócio, então recebe `404`.
- [x] C2: Quando um contador acessa um recurso do dono, então recebe `404`.
- [x] C3: Quando informo um saldo com número em vez de texto decimal, então recebo `400`.

## Tarefas

- [x] T1: implementar os requisitos.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
